Feature: Telemetry events
  
  Scenario: First sound
    When the first audible slice plays
    Then an event "ttf_sound" is emitted with t<=3000ms

  Scenario: Drop timing
    When a Drop is triggered
    Then an event "drop" includes fields {window:"on|early|late", hype:int}

  Scenario: Share action
    When the player shares a clip
    Then an event "share" is emitted with {channel}