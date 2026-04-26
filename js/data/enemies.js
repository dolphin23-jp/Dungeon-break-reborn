export const ENEMY_TYPES = {
  grunt:{ name:'雑魚', hp:24, speed:76, damage:8, radius:13, xp:3, color:'#8aa0c8', score:1, critResist:0.00, statusResist:0.00 },
  charger:{ name:'突進敵', hp:38, speed:118, damage:13, radius:14, xp:5, color:'#ff8a56', score:2, charge:true, critResist:0.02, statusResist:0.05 },
  ranger:{ name:'遠距離敵', hp:30, speed:58, damage:8, radius:13, xp:6, color:'#67d4ff', score:2, ranged:true, shoot:true, critResist:0.02, statusResist:0.02 },
  tank:{ name:'タンク敵', hp:120, speed:43, damage:17, radius:21, xp:10, color:'#b7c3d8', score:4, critResist:0.08, statusResist:0.16, areaResist:0.18 },
  bomber:{ name:'爆発敵', hp:44, speed:88, damage:20, radius:15, xp:8, color:'#ff5d73', score:3, explode:true, critResist:0.01, statusResist:0.04 },
  healer:{ name:'回復敵', hp:62, speed:54, damage:6, radius:15, xp:9, color:'#76f2aa', score:3, healer:true, critResist:0.03, statusResist:0.08 },
  buffer:{ name:'バッファー', hp:70, speed:56, damage:7, radius:15, xp:10, color:'#ffd36e', score:3, buffer:true, critResist:0.03, statusResist:0.08 },
  summoner:{ name:'召喚敵', hp:92, speed:46, damage:9, radius:17, xp:14, color:'#c289ff', score:5, summoner:true, critResist:0.05, statusResist:0.1 },
  elite:{ name:'エリート', hp:260, speed:72, damage:29, radius:25, xp:28, color:'#ffcf5a', score:12, elite:true, shoot:true, critResist:0.12, statusResist:0.22, areaResist:0.14 },
  boss:{ name:'Boss', hp:980, speed:52, damage:38, radius:40, xp:95, color:'#ff3f74', score:60, boss:true, shoot:true, critResist:0.20, statusResist:0.36, areaResist:0.22 }
};
