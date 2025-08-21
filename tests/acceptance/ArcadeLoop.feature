Feature: Arcade core loop
  
  Scenario: Combo and Taste
    Given assist mode is Normal
    When the player repeats the same flourish more than 4 times in 8 bars
    Then Taste is reduced by at least one notch on the end-of-run sliders

  Scenario: Risk bonus
    When the player disables assist for a bar and maintains combo >= x3
    Then a Risk bonus is added to Score