Feature: One-handed accessibility
  
  Scenario: Enable one-hand mode
    When one-hand mode is toggled on
    Then the pad grid reduces to 4 pads with larger targets
    And all tutorials reference the new mapping