/** Turns a study set into a Markdown document users can keep, print or paste into other tools. */
export function studySetToMarkdown({ title, flashcards, quiz }) {
  const lines = [`# ${title}`, ''];

  if (flashcards.length > 0) {
    lines.push('## Flashcards', '');
    for (const card of flashcards) lines.push(`**Q:** ${card.front}`, '', `**A:** ${card.back}`, '');
  }

  if (quiz.length > 0) {
    lines.push('## Quiz', '');
    quiz.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      q.options.forEach((option, j) => lines.push(`   - [${j === q.answerIndex ? 'x' : ' '}] ${option}`));
      if (q.explanation) lines.push('', `   > ${q.explanation}`);
      lines.push('');
    });
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

export function fileNameFor(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug || 'study-set'}.md`;
}
