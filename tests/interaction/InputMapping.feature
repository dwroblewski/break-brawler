Feature: Keyboard mapping
  
  Scenario: Two-hand preset
    Given the two-hand preset is active
    Then pads map to A S D (top) and J K L (bottom)
    And Space or Enter triggers Drop
    And Shift+pad cycles roll rates 1/16 → 1/32 → 1/64

  Scenario: One-hand preset
    Given the one-hand preset is active
    Then pads map to Q W E and A S D