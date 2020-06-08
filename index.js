ygopro.i18ns["en-us"].koishi_roomlist_hint = "Fetching room list ...";
ygopro.i18ns["zh-cn"].koishi_roomlist_hint = "正在获取房间列表……";
ygopro.constants.STOC[49] = "KOISHI_ROOMLIST"

ygopro.ctos_follow_before("JOIN_GAME", true, async (buffer, info, client, server, datas) => { 
	if (settings.modules.stop || CLIENT_is_able_to_reconnect(client) || CLIENT_is_able_to_kick_reconnect(client)) { 
		return false;
	}
	if (info.pass.toUpperCase() == "L") { 
		ygopro.stoc_send_chat(client, "${koishi_roomlist_hint}", ygopro.constants.COLORS.BABYBLUE);
		var room_showed = [];
		var buffer_pos = 0;
		for (var room of ROOM_all) { 
			if (room && room.established && room.name.indexOf('$') == -1) { 
				room_showed.push(room);
			}
		}
		var room_buffer = Buffer.alloc(2 + 333 * room_showed.length);
		room_buffer.writeUInt16LE(room_showed.length, buffer_pos);
		buffer_pos += 2;
		for (var room of room_showed) { 
			room_buffer.write(room.name, buffer_pos, 64, "utf8");
			buffer_pos += 64;
			var oppo_pos = room.hostinfo.mode === 2 ? 2 : 1;
			room_buffer.writeUInt8((room.duel_stage === ygopro.constants.DUEL_STAGE.BEGIN ? 0 : room.duel_stage === ygopro.constants.DUEL_STAGE.SIDING ? 2 : 1), buffer_pos);
			++buffer_pos;
			room_buffer.writeInt8(room.duel_count, buffer_pos);
			++buffer_pos;
			room_buffer.writeInt8((room.turn != null ? room.turn : 0), buffer_pos);
			++buffer_pos;
			var room_players = [];
			for (var player of room.get_playing_player()) { 
				if (player) {
					room_players[player.pos] = player;
				}
			}
			var player_string = "???";
			if (room_players[0]) {
				player_string = room_players[0].name;
			}
			if (room.hostinfo.mode === 2) {
				player_string = player_string + "+" + (room_players[1] ? room_players[1].name : "???");
			}
			room_buffer.write(player_string, buffer_pos, 128, "utf8");
			buffer_pos += 128;
			if (room.duel_stage !== ygopro.constants.DUEL_STAGE.BEGIN) {
				room_buffer.writeInt8((room_players[0] && (room.scores[room_players[0].name_vpass] != null) ? room.scores[room_players[0].name_vpass] : 0), buffer_pos);
				++buffer_pos;
				room_buffer.writeInt32LE((room_players[0] && (room_players[0].lp != null) ? room_players[0].lp : room.hostinfo.start_lp), buffer_pos);
				buffer_pos += 4;
			} else {
				room_buffer.writeInt8(0, buffer_pos);
				++buffer_pos;
				room_buffer.writeInt32LE(0, buffer_pos);
				buffer_pos += 4;
			}
			player_string = "???";
			if (room_players[oppo_pos]) {
				player_string = room_players[oppo_pos].name;
			}
			if (room.hostinfo.mode === 2) {
				player_string = player_string + "+" + (room_players[oppo_pos + 1] ? room_players[oppo_pos + 1].name : "???");
			}
			room_buffer.write(player_string, buffer_pos, 128, "utf8");
			buffer_pos += 128;
			if (room.duel_stage !== ygopro.constants.DUEL_STAGE.BEGIN) {
				room_buffer.writeInt8((room_players[oppo_pos] && (room.scores[room_players[oppo_pos].name_vpass] != null) ? room.scores[room_players[oppo_pos].name_vpass] : 0), buffer_pos);
				++buffer_pos;
				room_buffer.writeInt32LE((room_players[oppo_pos] && (room_players[oppo_pos].lp != null) ? room_players[oppo_pos].lp : room.hostinfo.start_lp), buffer_pos);
				buffer_pos += 4;
			} else {
				room_buffer.writeInt8(0, buffer_pos);
				++buffer_pos;
				room_buffer.writeInt32LE(0, buffer_pos);
				buffer_pos += 4;
			}
		}
		ygopro.stoc_send(client, "KOISHI_ROOMLIST", room_buffer);
		setTimeout(() => {
			ygopro.stoc_send(client, 'ERROR_MSG', {
				msg: 1,
				code: 9
			});
			CLIENT_kick(client);
		}, 500);
		return true;
	}
	return false;
});
