# Unimatrix Social Deck

A browser game room for a Borg-themed Discord community. One player hosts a room and shares its link; two to ten players can join from their own phones or computers. The host browser runs the room authority and the players connect directly through PeerJS, so the project needs no account, database, API key, or continuously running server.

## Live site

https://phoenixcryos.github.io/unimatrix-social-deck/

## The five games

| Game | Players | Design and rules |
| --- | --- | --- |
| **Adaptation Accord** | 2–10 | A five-round cooperative crisis drill. Everyone secretly selects one response to each Borg mission prompt. The collective receives 2 integrity for a unanimous correct choice, 1 for a correct majority, and 0 otherwise. Reach 7 integrity to assimilate the mission successfully. |
| **Nanoprobe Duel** | 2 | A simultaneous five-round rock-paper-scissors duel. Beam defeats Adapt, Shield defeats Beam, and Adapt defeats Shield; the losing drone takes 2 hull damage. Both drones begin with 6 hull. The higher hull after round five wins. |
| **Cube Conquest** | 2–10 | Players join alternating Alpha and Beta teams. On your turn, claim an empty grid node orthogonally adjacent to any node owned by your team. Each team can once adapt an enemy node that touches two friendly nodes. The team controlling 13 nodes, or the most nodes on a full grid, wins. |
| **Memory Matrix** | 2–10 | Watch an expanding sequence of Borg glyphs, then rebuild it privately. There are five rounds. A correct reconstruction earns 2 points and the first correct player receives 1 additional point. The high score wins. |
| **Subspace Intercept** | 2–10 | Players take turns breaking a four-glyph signal. Each glyph may be used once. Teal means the right glyph in the right slot; amber means the glyph appears elsewhere. Break the signal within 12 collective attempts to win. |

Every game carries its complete rule card in the room, including objectives, scoring, turn order, and end conditions.

## Expansion deck: five new simulations

| Game | Players | Design and rules |
| --- | --- | --- |
| **Falling Block Skirmish** | 2–10 | Each drone builds its own 10×14 matrix with falling polyominoes. Move, rotate, and hard-drop twelve blocks. Clear horizontal lines for 100 points each; the first drone to clear five lines wins, otherwise the highest score after every drone places twelve blocks wins. |
| **Shield Breaker Fleet** | 2–10 | A turn-based brick-breaker race. On each turn, launch a nanoprobe through one of six lanes against your own 6×5 shield wall. The deterministic bounce path breaks blocks, and the first drone to clear its wall wins. The highest broken-block count after twelve shots each decides an unfinished match. |
| **Tile Matrix** | 2–10 | A Mahjong-style open-edge matching puzzle. Players take turns selecting two identical exposed tiles from the shared wall. An exposed tile has an empty space immediately left or right. A matching pair scores 1 and keeps the turn; a mismatch passes it. The high score when the wall clears wins. |
| **Borg Chess: Rapid Variant** | 2 + spectators | A full board game with standard piece movement, check, checkmate, stalemate, pawn promotion to a queen, and turn control. This rapid variant deliberately excludes castling and en passant; those rules appear in the in-game card. |
| **Borg Fleet Engagement** | 2 + spectators | Each commander privately places a four-vessel fleet on an 8×8 grid, then scans one enemy coordinate per turn. Hits earn another scan; misses pass control. The first commander to destroy every enemy vessel wins. |

The five additions share the existing PeerJS room connection: a host starts a room, remote players follow the invitation link, and the host browser holds the authoritative state during play. Fleet Engagement additionally sends each guest a view with the opposing fleet positions masked.

## Run it locally

Open `index.html` in a modern browser. For the most reliable cross-device test, serve this directory from any static web server and visit the address from a second device. Create a room, copy the share link, and have another player open it. The host must keep the room tab open while the match is running.

## Publish it

This is a static site. Drag the project folder or the supplied `unimatrix-social-deck.zip` onto [Netlify Drop](https://app.netlify.com/drop) to receive a public HTTPS URL. The published site works across devices without a backend because the player browsers connect to the host browser through PeerJS.

### Operational limits

- A room remains available only while its host browser tab stays open.
- Direct browser connections need normal WebRTC support. Very restrictive corporate networks can block them.
- The host has final authority over game state. This is a social game room, not an anti-cheat service.

