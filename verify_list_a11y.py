from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print("Navigating to list.html...")
        page.goto("http://localhost:8765/list.html")

        # 1. Verify Input Accessibility
        print("Verifying input accessibility...")
        input_locator = page.locator("#input")
        add_btn = page.locator("#add")

        aria_label_input = input_locator.get_attribute("aria-label")
        print(f"Input aria-label: {aria_label_input}")
        assert aria_label_input == "New item content", "Input aria-label missing or incorrect"

        aria_label_btn = add_btn.get_attribute("aria-label")
        print(f"Add button aria-label: {aria_label_btn}")
        assert aria_label_btn == "Add item", "Add button aria-label missing or incorrect"

        # 2. Add Item
        print("Adding item 'Test Item'...")
        input_locator.fill("Test Item")
        add_btn.click()

        # Wait for item to appear
        item_locator = page.locator(".item").first
        item_locator.wait_for()

        # 3. Verify Item Accessibility Attributes
        print("Verifying item accessibility attributes...")
        tabindex = item_locator.get_attribute("tabindex")
        role = item_locator.get_attribute("role")
        aria_checked = item_locator.get_attribute("aria-checked")
        data_id = item_locator.get_attribute("data-id")

        print(f"Item tabindex: {tabindex}")
        print(f"Item role: {role}")
        print(f"Item aria-checked: {aria_checked}")
        print(f"Item data-id: {data_id}")

        assert tabindex == "0", "Item missing tabindex=0"
        assert role == "checkbox", "Item missing role=checkbox"
        assert aria_checked == "false", "Item missing aria-checked=false"
        assert data_id, "Item missing data-id"

        # 4. Verify Delete Button Accessibility
        print("Verifying delete button accessibility...")
        del_btn = item_locator.locator(".del-btn")
        del_aria = del_btn.get_attribute("aria-label")
        print(f"Delete button aria-label: {del_aria}")
        assert del_aria == 'Delete Test Item', f"Delete button aria-label incorrect: {del_aria}"

        # 5. Test Keyboard Toggle and Focus Restoration
        print("Testing keyboard toggle (Space)...")
        item_locator.focus()
        page.keyboard.press("Space")

        # Wait for update
        page.wait_for_timeout(500) # Give time for render and focus restore

        # Check if checked
        new_aria_checked = item_locator.get_attribute("aria-checked")
        print(f"Item aria-checked after toggle: {new_aria_checked}")
        assert new_aria_checked == "true", "Item did not toggle to checked"

        # Check focus
        is_focused = item_locator.evaluate("el => document.activeElement === el")
        print(f"Item is focused: {is_focused}")
        assert is_focused, "Focus was lost after toggle"

        # 6. Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification.png")

        browser.close()
        print("Verification passed!")

if __name__ == "__main__":
    run()
