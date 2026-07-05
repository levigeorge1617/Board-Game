/*
 * Deployment config. GAME_SERVER is the public host of your game server
 * (no https://, no port for wss hosts). With it set, "Go online" only asks for a
 * room code, ?room=CODE links auto-join, and players never type a host.
 * Override per-visit with ?host=... in the URL. Leave '' to always be prompted.
 */
window.GAME_SERVER = 'board-game-bar3.onrender.com';
window.GAME_DEFAULT_ROOM = 'table-1';
