/** 処理結果モデルと表示(仕様§13)。ファイル名は textContent 経由でのみ描画する。 */

export type ItemStatus = 'success' | 'failed';

export interface ProcessResult {
  sourceName: string;
  outputName?: string;
  status: ItemStatus;
  /** 補足情報(WebP→PNG 代替など)。成功扱いだが注意喚起が必要な場合に使用 */
  note?: string;
  /** 失敗理由(status が failed の場合) */
  error?: string;
}

function makeStatCard(label: string, value: string | number, variant?: 'primary' | 'success' | 'danger' | 'info'): HTMLElement {
  const card = document.createElement('div');
  card.className = `stat-card ${variant ? `stat-${variant}` : ''}`;
  
  const title = document.createElement('div');
  title.className = 'stat-label';
  title.textContent = label;
  
  const val = document.createElement('div');
  val.className = 'stat-value';
  val.textContent = String(value);
  
  card.append(title, val);
  return card;
}

function makeListItem(className: string, ...nodes: (string | Node)[]): HTMLLIElement {
  const li = document.createElement('li');
  li.className = `result-item ${className}`;
  for (const node of nodes) {
    li.append(node);
  }
  return li;
}

export function renderResult(
  container: HTMLElement,
  results: ProcessResult[],
  destinationLabel: string,
  elapsedMs?: number,
): void {
  container.textContent = '';

  const successes = results.filter((r) => r.status === 'success');
  const failures = results.filter((r) => r.status === 'failed');
  const noted = successes.filter((r) => r.note);

  // ヘッダー部
  const header = document.createElement('div');
  header.className = 'result-header';
  
  const heading = document.createElement('h2');
  heading.className = 'result-title';
  heading.textContent = failures.length > 0 ? '変換完了（一部エラーあり）' : '変換完了';
  
  const badge = document.createElement('span');
  badge.className = `status-pill ${failures.length > 0 ? 'pill-warning' : 'pill-success'}`;
  badge.textContent = failures.length > 0 ? 'Completed with errors' : 'All Successful';
  
  header.append(heading, badge);
  container.appendChild(header);

  // 統計メトリクスグリッド
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';
  statsGrid.appendChild(makeStatCard('合計画像数', results.length, 'primary'));
  statsGrid.appendChild(makeStatCard('成功', successes.length, 'success'));
  statsGrid.appendChild(makeStatCard('失敗', failures.length, failures.length > 0 ? 'danger' : 'info'));
  if (typeof elapsedMs === 'number') {
    const sec = (elapsedMs / 1000).toFixed(1);
    statsGrid.appendChild(makeStatCard('所要時間', `${sec}s`));
  }
  container.appendChild(statsGrid);

  // 保存先情報カード
  const destCard = document.createElement('div');
  destCard.className = 'destination-box';
  const destIcon = document.createElement('span');
  destIcon.className = 'dest-icon';
  destIcon.textContent = '📁';
  const destText = document.createElement('div');
  destText.className = 'dest-text';
  const destTitle = document.createElement('span');
  destTitle.className = 'dest-title';
  destTitle.textContent = '保存先：';
  const destPath = document.createElement('span');
  destPath.className = 'dest-path';
  destPath.textContent = destinationLabel;
  destText.append(destTitle, destPath);
  destCard.append(destIcon, destText);
  container.appendChild(destCard);

  if (noted.length > 0) {
    const warning = document.createElement('div');
    warning.className = 'result-alert alert-warning';
    warning.textContent = `※ ${noted.length}件はWebP非対応のためPNGで保存しました。`;
    container.appendChild(warning);
  }

  // 失敗ファイルリスト
  if (failures.length > 0) {
    const section = document.createElement('div');
    section.className = 'result-section';
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'section-subtitle failure-title';
    sectionTitle.textContent = `失敗したファイル (${failures.length})`;
    section.appendChild(sectionTitle);

    const list = document.createElement('ul');
    list.className = 'result-list';
    for (const failure of failures) {
      const icon = document.createElement('span');
      icon.className = 'status-icon icon-ng';
      icon.textContent = '✕';
      
      const fileInfo = document.createElement('div');
      fileInfo.className = 'item-info';
      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = failure.sourceName;
      const err = document.createElement('div');
      err.className = 'item-detail text-danger';
      err.textContent = failure.error ?? '不明なエラー';
      fileInfo.append(name, err);

      const li = makeListItem('li-danger', icon, fileInfo);
      list.appendChild(li);
    }
    section.appendChild(list);
    container.appendChild(section);
  }

  // 成功ファイルリスト
  if (successes.length > 0) {
    const section = document.createElement('div');
    section.className = 'result-section';
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'section-subtitle success-title';
    sectionTitle.textContent = `リサイズ成功 (${successes.length})`;
    section.appendChild(sectionTitle);

    const list = document.createElement('ul');
    list.className = 'result-list';
    for (const success of successes) {
      const icon = document.createElement('span');
      icon.className = 'status-icon icon-ok';
      icon.textContent = '✓';

      const fileInfo = document.createElement('div');
      fileInfo.className = 'item-info';
      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = `${success.sourceName} → ${success.outputName ?? success.sourceName}`;
      
      fileInfo.append(name);
      if (success.note) {
        const note = document.createElement('div');
        note.className = 'item-detail text-warn';
        note.textContent = success.note;
        fileInfo.appendChild(note);
      }

      const li = makeListItem('li-success', icon, fileInfo);
      list.appendChild(li);
    }
    section.appendChild(list);
    container.appendChild(section);
  }

  container.hidden = false;
}
