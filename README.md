# DUNGEON BREAK REBORN — Phase 1

ブラウザで遊べるローグライト・オートバトルアクションの新規プロジェクトです。GitHub Pagesへこのフォルダをそのまま配置して動作します。

## 実装済み

- 複数ファイル構成
- タイトル画面
- 戦闘画面
- 固定アリーナ
- 手動移動 / オート移動切替
- 複数敵出現
- 自動攻撃
- 経験値、レベルアップ、スキル選択
- Wave進行
- Boss簡易実装
- ゲームオーバー
- 深淵石
- 永続強化
- +1 / +10 / +100 / 最大まで / カテゴリ一括 / 全体均等強化
- デバッグ用 深淵石 +100,000
- localStorage保存
- assets/images, assets/audio の将来拡張用フォルダ

## 起動方法

ローカルではブラウザのES Modules制約があるため、簡易サーバーで起動してください。

```bash
cd dungeon-break-reborn
python3 -m http.server 8000
```

その後、`http://localhost:8000` を開きます。

GitHub Pagesではリポジトリ直下、またはdocs配下に配置して公開してください。

## 設計メモ

- `js/core` : ゲーム本体、保存、定数、ユーティリティ
- `js/entities` : Player / Enemy / Projectile
- `js/systems` : 戦闘、Wave、入力、Loot
- `js/data` : スキル、敵、永続強化などのデータ定義
- `js/ui` : DOM操作、描画、永続強化画面
- `assets` : 将来的な画像・BGM・SE格納場所

Phase 2以降では、装備管理画面、Legendary固有効果の本格実装、敵弾、召喚体、実績一覧、セーブエクスポート/インポートを追加しやすい構成にしています。
