Feature: Timing windows
  
  Scenario Outline: Quantize windows by difficulty
    Given difficulty is <mode>
    When a hit occurs <ms> ms from the ideal grid
    Then it is scored as <result>

    Examples:
      | mode   | ms  | result   |
      | Easy   |  70 | on-time  |
      | Easy   | 120 | late     |
      | Normal |  50 | on-time  |
      | Expert |  40 | late     |