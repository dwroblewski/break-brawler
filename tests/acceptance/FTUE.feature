Feature: First-Time User Experience (FTUE)
  As a new player
  I want sound immediately and guided gestures
  So that I feel successful and save a clip in under 2 minutes

  Background:
    Given BPM is 172
    And assist mode is Easy

  Scenario: Cold Open – tap produces sound within 3 seconds
    When the app loads at t=0
    Then a tap on the AMEN pad at t<=3s produces an audible slice
    And the crowd meter becomes visible

  Scenario: Teach Roll – swipe/roll increases Hype
    Given the player has tapped at least 4 slices
    When the player performs a roll gesture
    Then the Hype meter increases by at least 15 percent

  Scenario: Teach Stutter – release near bead 4
    When the player holds a slice for >=100 ms and releases within ±90 ms of bead 4
    Then a stutter tail is heard
    And a hint "Nice release" is shown

  Scenario: Teach Drop – cash Hype within window
    Given Hype >= 50 percent and the phrase is on beat 4
    When the player triggers Drop during the spendable window
    Then a drop plays with bass sidechain "Classic" per AudioTiming#Sidechain
    And clip capture starts

  Scenario: Save Clip – end-of-run
    When the run ends after 90 seconds
    Then a 20-second clip is available to Save or Share