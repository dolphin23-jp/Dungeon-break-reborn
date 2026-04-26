export const ENEMY_TYPES = {
  grunt:{ name:'雑魚', hp:24, speed:72, damage:8, radius:13, xp:3, color:'#8aa0c8', score:1 },
  charger:{ name:'突進敵', hp:34, speed:112, damage:12, radius:14, xp:5, color:'#ff8a56', score:2, charge:true },
  ranger:{ name:'遠距離敵', hp:28, speed:55, damage:7, radius:13, xp:6, color:'#67d4ff', score:2, ranged:true },
  tank:{ name:'タンク敵', hp:100, speed:42, damage:16, radius:20, xp:10, color:'#b7c3d8', score:4 },
  bomber:{ name:'爆発敵', hp:42, speed:84, damage:18, radius:15, xp:8, color:'#ff5d73', score:3, explode:true },
  healer:{ name:'回復敵', hp:54, speed:52, damage:5, radius:15, xp:9, color:'#76f2aa', score:3, healer:true },
  buffer:{ name:'バッファー', hp:60, speed:56, damage:6, radius:15, xp:10, color:'#ffd36e', score:3, buffer:true },
  summoner:{ name:'召喚敵', hp:80, speed:44, damage:8, radius:17, xp:14, color:'#c289ff', score:5, summoner:true },
  elite:{ name:'エリート', hp:220, speed:68, damage:25, radius:24, xp:26, color:'#ffcf5a', score:12, elite:true },
  boss:{ name:'Boss', hp:900, speed:50, damage:34, radius:38, xp:90, color:'#ff3f74', score:60, boss:true }
};
