// Grouped specification lists. A spec may carry a "flag" (value awaiting manufacturer confirmation).
import { esc } from '../core/dom.js';

export function specGroups(specs) {
  const groups = new Map();
  specs.forEach((s) => {
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group).push(s);
  });
  return `<div class="spec-groups">${[...groups].map(([name, rows]) => `
    <div class="spec-group" data-reveal>
      <h3>${esc(name)}</h3>
      <dl class="spec-list">${rows.map((r) => `
        <div class="spec-row"><dt>${esc(r.label)}</dt><dd>${esc(r.value)}${r.flag ? `<span class="spec-flag">⚑ ${esc(r.flag)}</span>` : ''}</dd></div>`).join('')}
      </dl>
    </div>`).join('')}</div>`;
}
