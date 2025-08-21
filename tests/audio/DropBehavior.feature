Feature: Drop behavior
  
  Scenario: Spend Hype in drop window
    Given Hype >= 50 percent
    And the phrase is on beat 4 of a 4-bar section
    When Drop is triggered
    Then the sidechain depth equals Classic (≈6 dB)
    And a DJ cut occurs prior to the downbeat
    And late triggers auto-queue to the next bar