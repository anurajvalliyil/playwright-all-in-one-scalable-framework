"""
DeepEval-based evaluation for SDLC Automation Pipeline results.

Uses Groq's Llama model as an LLM judge to evaluate the quality
of generated Playwright scripts across 5 dimensions:
1. Goal Completion
2. Script Quality (POM)
3. Script Quality (AAA)
4. Step Accuracy
5. Hallucination Detection
"""

import os
import json
import sys
import glob
from datetime import datetime, timezone

# ── Load environment ────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    print("[DeepEval] ERROR: GROQ_API_KEY not set in .env")
    sys.exit(1)

# ── Custom Groq LLM for DeepEval ───────────────────────────────────────────
from deepeval.models import DeepEvalBaseLLM

class GroqLlamaJudge(DeepEvalBaseLLM):
    """Custom LLM judge using Groq's Llama model for evaluation."""

    def __init__(self, model_name: str = "llama-3.1-8b-instant"):
        self.model_name = model_name
        self._client = None

    def _get_client(self):
        if self._client is None:
            from groq import Groq
            self._client = Groq(api_key=GROQ_API_KEY)
        return self._client

    def load_model(self):
        return self.model_name

    def generate(self, prompt: str, schema=None) -> str:
        """Synchronous generation using Groq API."""
        import time
        # Rate limit guard
        time.sleep(2)

        try:
            client = self._get_client()

            messages = [{"role": "user", "content": prompt}]

            kwargs = {
                "messages": messages,
                "model": self.model_name,
                "max_tokens": 4096,
                "temperature": 0.1,
            }

            if schema is not None:
                kwargs["response_format"] = {"type": "json_object"}

            completion = client.chat.completions.create(**kwargs)
            response = completion.choices[0].message.content
            return response
        except Exception as e:
            print(f"[GroqLlama] Error: {e}")
            # Retry once with delay
            import time
            time.sleep(5)
            try:
                client = self._get_client()
                completion = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.model_name,
                    max_tokens=4096,
                    temperature=0.1,
                )
                return completion.choices[0].message.content
            except Exception as e2:
                return f"Error generating response: {e2}"

    async def a_generate(self, prompt: str, schema=None) -> str:
        """Async generation - falls back to sync for Groq."""
        return self.generate(prompt, schema)

    def get_model_name(self) -> str:
        return f"Groq/{self.model_name}"


# ── Load Pipeline Data ──────────────────────────────────────────────────────
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "evaluate_config.json")
    with open(config_path, "r") as f:
        return json.load(f)


def load_report(report_path: str) -> dict:
    with open(report_path, "r") as f:
        return json.load(f)


def load_file(file_path: str) -> str:
    try:
        with open(file_path, "r") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def load_page_objects(pages_dir: str) -> dict:
    """Load all page object files from the pages directory."""
    page_objects = {}
    if os.path.exists(pages_dir):
        for ts_file in glob.glob(os.path.join(pages_dir, "*.ts")):
            name = os.path.basename(ts_file)
            with open(ts_file, "r") as f:
                page_objects[name] = f.read()
    return page_objects


# ── Build Evaluation Test Cases ─────────────────────────────────────────────
from deepeval.test_case import LLMTestCase
try:
    from deepeval.test_case import SingleTurnParams as EvalParams
except ImportError:
    from deepeval.test_case import LLMTestCaseParams as EvalParams
from deepeval.metrics import GEval


def build_goal_completion_metric(model) -> GEval:
    """Metric 1: Did the pipeline achieve all goal steps?"""
    return GEval(
        name="Goal Completion",
        criteria=(
            "Evaluate whether the actual output (pipeline execution results) "
            "successfully completed ALL steps described in the input (goal). "
            "Check if each numbered step in the goal has a corresponding 'passed' "
            "result in the execution trace. A step is considered complete if its "
            "status is 'passed' or 'passed (healed)'. Deduct score for any step "
            "that is 'failed', 'blocked', or missing from results."
        ),
        evaluation_params=[
            EvalParams.INPUT,
            EvalParams.ACTUAL_OUTPUT,
        ],
        threshold=0.7,
        model=model,
    )


def build_pom_quality_metric(model) -> GEval:
    """Metric 2: Does the generated spec follow POM pattern?"""
    return GEval(
        name="Script Quality (POM)",
        criteria=(
            "Evaluate the Page Object Model quality of the generated Playwright test script. "
            "Check for:\n"
            "1. Proper imports from page object files (LoginPage, ProductsPage, CartPage, CheckoutPage)\n"
            "2. Page object instantiation in the test body using constructor pattern\n"
            "3. Actions performed through page object methods (not raw locators)\n"
            "4. Each page object class should encapsulate selectors and actions for a single page\n"
            "5. No hardcoded selectors in the spec file - all should be in page objects\n"
            "Score 1.0 if all criteria are met, 0.0 if none are met."
        ),
        evaluation_params=[
            EvalParams.ACTUAL_OUTPUT,
        ],
        threshold=0.7,
        model=model,
    )


def build_aaa_quality_metric(model) -> GEval:
    """Metric 3: Does the spec follow Arrange-Act-Assert pattern?"""
    return GEval(
        name="Script Quality (AAA)",
        criteria=(
            "Evaluate whether the generated test script follows the Arrange-Act-Assert pattern. "
            "Check for:\n"
            "1. Clear 'Arrange' section where page objects are initialized\n"
            "2. Multiple 'Act & Assert' sections for distinct test phases (Login, Cart, Checkout, etc.)\n"
            "3. Comments or section markers (e.g., '// Arrange', '// Act & Assert') separating phases\n"
            "4. Each phase contains both action code (Act) and verification assertions (Assert)\n"
            "5. Logical ordering of phases matching the user workflow\n"
            "Score 1.0 if all criteria are met, 0.0 if none are met."
        ),
        evaluation_params=[
            EvalParams.ACTUAL_OUTPUT,
        ],
        threshold=0.7,
        model=model,
    )


def build_step_accuracy_metric(model) -> GEval:
    """Metric 4: Are the Playwright selectors correct?"""
    return GEval(
        name="Step Accuracy",
        criteria=(
            "Evaluate the accuracy of Playwright selectors and actions in the generated test. "
            "The test targets SauceDemo (https://www.saucedemo.com). Check against known correct selectors:\n"
            "- Login: [data-test='username'], [data-test='password'], [data-test='login-button']\n"
            "- Products title: .title\n"
            "- Add to cart: [data-test='add-to-cart-sauce-labs-backpack'], etc.\n"
            "- Cart: .shopping_cart_link, .shopping_cart_badge, .cart_item\n"
            "- Checkout form: [data-test='firstName'], [data-test='lastName'], [data-test='postalCode']\n"
            "- Buttons: [data-test='continue'], [data-test='finish'], [data-test='back-to-products']\n"
            "- Complete: .complete-header\n"
            "- Menu: #react-burger-menu-btn (ID!), #logout_sidebar_link (ID!)\n"
            "Deduct points for each incorrect, hallucinated, or missing selector."
        ),
        evaluation_params=[
            EvalParams.ACTUAL_OUTPUT,
            EvalParams.EXPECTED_OUTPUT,
        ],
        threshold=0.7,
        model=model,
    )


def build_hallucination_metric(model) -> GEval:
    """Metric 5: Did the LLM invent non-existent UI elements?"""
    return GEval(
        name="Hallucination Detection",
        criteria=(
            "Analyze the actual output (the generated Playwright test script). "
            "Your task is to check if the script tries to interact with UI elements that DO NOT exist in SauceDemo. "
            "Specifically, check if the script contains ANY of the following hallucinations:\n"
            "1. Interacting with a payment or credit card form\n"
            "2. Clicking a 'Pay Now' button\n"
            "3. Checking for products priced at $20.99 or $24.99\n"
            "4. Clicking a 'Continue Shopping' button on the checkout complete page\n"
            "5. Using [data-test='react-burger-menu-btn'] instead of the # id selector\n"
            "If the script DOES NOT contain any of these hallucinations, you MUST score 1.0. "
            "Only deduct points if you actually see these hallucinated elements in the code."
        ),
        evaluation_params=[
            EvalParams.ACTUAL_OUTPUT,
        ],
        threshold=0.7,
        model=model,
    )


# ── Main Evaluation ─────────────────────────────────────────────────────────
def run_evaluation():
    print("\n" + "=" * 60)
    print("  DeepEval — LLM Result Quality Evaluation")
    print("=" * 60)

    # Load config and data
    config = load_config()
    report = load_report(config["reportPath"])
    spec_content = load_file(config["specPath"])
    page_objects = load_page_objects(config["pagesDir"])

    if not spec_content:
        print("[DeepEval] ERROR: No spec file found at", config["specPath"])
        sys.exit(1)

    # Initialize the Groq LLM judge
    judge = GroqLlamaJudge(model_name="meta-llama/llama-4-scout-17b-16e-instruct")
    print(f"  Judge Model: {judge.get_model_name()}")
    print(f"  Report: {config['reportPath']}")
    print(f"  Spec: {config['specPath']}")
    print("-" * 60)

    # Build combined content for evaluation
    goal = report.get("goal", "")
    
    # Strip bulky DOM and code snippets from results to prevent 413 Token Limit errors
    results_raw = report.get("results", {})
    results_clean = {}
    for tc_id, tc_data in results_raw.items():
        results_clean[tc_id] = {"status": tc_data.get("status")}
        if "ui" in tc_data and "steps" in tc_data["ui"]:
            clean_steps = []
            for step in tc_data["ui"]["steps"]:
                clean_steps.append({
                    "id": step.get("id"),
                    "description": step.get("description"),
                    "status": step.get("status"),
                    "error": step.get("error")
                })
            results_clean[tc_id]["ui_steps"] = clean_steps

    results_summary = json.dumps(results_clean, indent=2)

    # Combine spec + page objects for script quality evaluation
    full_script = f"=== SPEC FILE ===\n{spec_content}\n\n"
    for name, content in page_objects.items():
        full_script += f"=== PAGE OBJECT: {name} ===\n{content}\n\n"

    # Known correct selectors as expected output
    expected_selectors = """
Known correct SauceDemo selectors:
- [data-test="username"], [data-test="password"], [data-test="login-button"]
- .title (Products page title)
- [data-test="add-to-cart-sauce-labs-backpack"], [data-test="add-to-cart-sauce-labs-bike-light"]
- .shopping_cart_link, .shopping_cart_badge, .cart_item
- [data-test="checkout"], [data-test="firstName"], [data-test="lastName"], [data-test="postalCode"]
- [data-test="continue"], [data-test="finish"], [data-test="back-to-products"]
- .complete-header
- #react-burger-menu-btn (ID, not data-test), #logout_sidebar_link (ID, not data-test)
"""

    # ── Build Test Cases ─────────────────────────────────────────────────
    tc_goal = LLMTestCase(
        input=goal,
        actual_output=results_summary,
    )

    tc_pom = LLMTestCase(
        input="Evaluate Page Object Model quality",
        actual_output=full_script,
    )

    tc_aaa = LLMTestCase(
        input="Evaluate Arrange-Act-Assert pattern",
        actual_output=spec_content,
    )

    tc_accuracy = LLMTestCase(
        input="Evaluate selector accuracy",
        actual_output=full_script,
        expected_output=expected_selectors,
    )

    tc_hallucination = LLMTestCase(
        input="Check for hallucinated UI elements",
        actual_output=full_script,
    )

    # ── Build Metrics ────────────────────────────────────────────────────
    metrics_config = [
        (build_goal_completion_metric(judge), tc_goal),
        (build_pom_quality_metric(judge), tc_pom),
        (build_aaa_quality_metric(judge), tc_aaa),
        (build_step_accuracy_metric(judge), tc_accuracy),
        (build_hallucination_metric(judge), tc_hallucination),
    ]

    # ── Evaluate Each Metric ─────────────────────────────────────────────
    eval_results = []
    total_score = 0.0
    all_passed = True

    for metric, test_case in metrics_config:
        print(f"\n  [EVAL] Evaluating: {metric.name}...")
        try:
            metric.measure(test_case)
            score = metric.score if metric.score is not None else 0.0
            reason = metric.reason if hasattr(metric, 'reason') and metric.reason else "No reason provided"
            passed = score >= metric.threshold

            result = {
                "name": metric.name,
                "score": round(score, 3),
                "passed": passed,
                "threshold": metric.threshold,
                "reason": reason,
            }
            eval_results.append(result)
            total_score += score

            status = "[PASS]" if passed else "[FAIL]"
            print(f"     {status} -- Score: {score:.2f} (threshold: {metric.threshold})")
            print(f"     Reason: {reason[:120]}...")

            if not passed:
                all_passed = False

        except Exception as e:
            print(f"     [WARN] Error evaluating {metric.name}: {e}")
            eval_results.append({
                "name": metric.name,
                "score": 0.0,
                "passed": False,
                "threshold": metric.threshold,
                "reason": f"Evaluation error: {str(e)}",
            })
            all_passed = False

    # ── Compute Overall Score ────────────────────────────────────────────
    num_metrics = len(eval_results)
    overall_score = round(total_score / num_metrics, 3) if num_metrics > 0 else 0.0

    output = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": judge.get_model_name(),
        "metrics": eval_results,
        "overallScore": overall_score,
        "overallPassed": all_passed,
        "pipelineStatus": report.get("results", {}).get("TC-001", {}).get("status", "unknown"),
    }

    # ── Write Results ────────────────────────────────────────────────────
    output_path = config["outputPath"]
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    # ── Inject into HTML Dashboard ───────────────────────────────────────
    html_path = os.path.join(os.path.dirname(__file__), "reports", "summary.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            html_str = f.read()
            
        json_str = json.dumps(output)
        html_str = html_str.replace(
            "window.__DEEPEVAL_DATA__ = null; // INJECT_DEEPEVAL_DATA_HERE",
            f"window.__DEEPEVAL_DATA__ = {json_str}; // INJECT_DEEPEVAL_DATA_HERE"
        )
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_str)
        print("  [INFO] Injected evaluation results into summary.html")

    # ── Summary ──────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"  Overall Score: {overall_score:.2f} / 1.00")
    print(f"  Status: {'[ALL PASSED]' if all_passed else '[SOME FAILED]'}")
    print(f"  Results saved to: {output_path}")
    print("=" * 60 + "\n")

    return output


if __name__ == "__main__":
    run_evaluation()
