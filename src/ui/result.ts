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

function makeListItem(className: string, ...nodes: (string | Node)[]): HTMLLIElement {
  const li = document.createElement('li');
  li.className = className;
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

  const heading = document.createElement('h2');
  heading.textContent =
    failures.length > 0 ? '処理完了（一部失敗）' : results.length > 0 ? '処理完了' : '対象ファイルがありません';
  container.appendChild(heading);

  const summary = document.createElement('p');
  summary.className = 'summary';
  const okCount = document.createElement('b');
  okCount.className = 'ok';
  okCount.textContent = String(successes.length);
  const ngCount = document.createElement('b');
  ngCount.className = 'ng';
  ngCount.textContent = String(failures.length);
  summary.append('成功：', okCount, '\u3000失敗：', ngCount);
  container.appendChild(summary);

  const destination = document.createElement('p');
  destination.className = 'destination';
  destination.textContent = `保存先：${destinationLabel}`;
  container.appendChild(destination);

  if (noted.length > 0) {
    const warning = document.createElement('p');
    warning.className = 'warning';
    warning.textContent = `※${noted.length}件はこのブラウザがWebP保存に対応していないためPNGで保存しました。`;
    container.appendChild(warning);
  }

  if (typeof elapsedMs === 'number') {
    const seconds = (elapsedMs / 1000).toFixed(1);
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `処理時間：${seconds}秒`;
    container.appendChild(meta);
  }

  if (failures.length > 0) {
    const details = document.createElement('details');
    details.open = true;
    const caption = document.createElement('summary');
    caption.textContent = `失敗したファイル（${failures.length}）`;
    details.appendChild(caption);

    const list = document.createElement('ul');
    for (const failure of failures) {
      list.appendChild(makeListItem('li-ng', `${failure.sourceName} — ${failure.error ?? '不明なエラー'}`));
    }
    details.appendChild(list);
    container.appendChild(details);
  }

  if (successes.length > 0) {
    const details = document.createElement('details');
    const caption = document.createElement('summary');
    caption.textContent = `成功したファイル（${successes.length}）`;
    details.appendChild(caption);

    const list = document.createElement('ul');
    for (const success of successes) {
      const item = success.note
        ? makeListItem(`li-ok li-note`, `${success.sourceName} → ${success.outputName}（${success.note}）`)
        : makeListItem('li-ok', `${success.sourceName} → ${success.outputName}`);
      list.appendChild(item);
    }
    details.appendChild(list);
    container.appendChild(details);
  }

  container.hidden = false;
}
