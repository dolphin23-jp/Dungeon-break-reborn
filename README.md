# DUNGEON BREAK REBORN — Phase 2

ブラウザで遊べるローグライト・オートバトルアクションゲームです。GitHub Pagesで公開できる静的Web構成です。

## 実行方法

```bash
python3 -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開きます。

GitHub Pagesでは、このフォルダの中身をリポジトリ直下に置いて公開してください。

## Phase 2で追加した主な内容

- 敵タイプの役割強化
  - 雑魚
  - 突進敵
  - 遠距離敵
  - タンク敵
  - 爆発敵
  - 回復敵
  - バッファー
  - 召喚敵
  - エリート
  - Boss
- 敵弾の追加
- Bossの範囲予兆攻撃
- 爆発敵の予兆付き爆発
- 敵のクリティカル耐性、状態異常耐性、範囲耐性
- 属性スキル強化
  - 連鎖雷
  - 火炎円環
  - 火爆発
  - 氷鈍足
  - 毒DoT
  - 毒爆発
  - 出血
  - 障壁再展開
  - 敵弾反射
  - 召喚体
- 装備ドロップ実装
- 9装備スロット実装
- 装備レアリティ実装
- 自動装備更新
- Legendary以上の固有効果実装
- 永続強化項目の拡張
- 実績報酬による永続強化レベル直接上昇

## ディレクトリ構成

```text
dungeon-break-reborn/
├── index.html
├── README.md
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── ui.css
│   └── game.css
├── js/
│   ├── main.js
│   ├── core/
│   │   ├── constants.js
│   │   ├── game.js
│   │   ├── storage.js
│   │   └── utils.js
│   ├── data/
│   │   ├── enemies.js
│   │   ├── skills.js
│   │   └── upgrades.js
│   ├── entities/
│   │   ├── enemy.js
│   │   ├── player.js
│   │   └── projectile.js
│   ├── systems/
│   │   ├── combat.js
│   │   ├── input.js
│   │   ├── loot.js
│   │   └── wave.js
│   └── ui/
│       ├── dom.js
│       ├── metaView.js
│       └── renderer.js
└── assets/
    ├── images/
    └── audio/
```

## 操作

- PC: WASD / 矢印キーで移動
- iPad / スマホ: 左下の仮想スティックで移動
- Mキーまたは画面上部ボタンで手動移動 / オート移動を切り替え
- 攻撃・スキル発動は自動

## 保存

`localStorage` に保存します。Phase 2の保存キーは以下です。

```text
dungeonBreakReborn.phase2.save
```

Phase 1の保存データがある場合は初回読み込み時に一部引き継ぎます。
