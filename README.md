# DUNGEON BREAK REBORN — Phase 3

ブラウザで遊べるローグライト・オートバトルアクションゲームです。GitHub Pagesでそのまま公開できる静的Webプロジェクトです。

## 起動方法

```bash
python3 -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開きます。

GitHub Pagesでは、このフォルダの中身をリポジトリ直下に置いて公開してください。

## Phase 3 追加内容

- 深度選択
  - 最高Waveに応じて深度 II〜Vを解放
  - 深度が上がるほど敵HP・攻撃・出現数・報酬倍率・高レア率が上昇
- 実績画面
  - 達成済み/未達成を一覧表示
  - 報酬として深淵石や永続強化レベルを直接付与
- 装備管理画面
  - 所持装備一覧
  - 手動装備
  - 装備分解
  - Common/Rare一括分解
- セーブ管理
  - localStorage保存
  - セーブデータのエクスポート/インポート
- ビルド確認
  - 探索終了時に習得スキルと入手装備を確認可能
  - 戦闘中にもビルドボタンから確認可能
- Phase 2からの引き継ぎ
  - Phase 2保存キーがある場合は読み込み、Phase 3保存へ移行

## 保存キー

```text
dungeonBreakReborn.phase3.save
```

Phase 2保存キー:

```text
dungeonBreakReborn.phase2.save
```

## ディレクトリ構造

```text
dungeon-break-reborn/
├── index.html
├── README.md
├── css/
├── js/
│   ├── core/
│   ├── data/
│   ├── entities/
│   ├── systems/
│   └── ui/
└── assets/
    ├── images/
    └── audio/
```

## 今後の拡張候補

- 装備合成・再鑑定
- 図鑑
- チャレンジモード
- スキル進化
- Boss固有行動の追加
- BGM/SE/画像素材の追加
