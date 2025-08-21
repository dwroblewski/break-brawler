Feature: Daily Break goals
  
  Scenario: Bronze – keep combo
    Given a target groove "Think 170"
    When the player completes 16 bars with no combo drop
    Then Bronze is awarded

  Scenario: Gold – perfect drop
    When the Drop is triggered within the exact window on a phrase end
    Then Gold is awarded