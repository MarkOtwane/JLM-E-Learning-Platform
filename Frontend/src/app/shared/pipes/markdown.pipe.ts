import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    let html = value;

    // Escape HTML to prevent XSS
    html = html
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>');

    // Convert markdown-style formatting to HTML

    // Headers (## Heading)
    html = html.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^###\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^####\s+(.+)$/gm, '<h5>$1</h5>');

    // Bold (**text**)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic (*text*)
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Numbered lists (1. Item)
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="numbered" value="$1">$2</li>');
    
    // Wrap consecutive numbered items in ol
    html = html.replace(/(<li class="numbered"[^>]*>[\s\S]*?<\/li>\n?)+/g, (match) => {
      return '<ol class="instruction-list">' + match + '</ol>';
    });

    // Bullet lists (° Item or - Item)
    html = html.replace(/^[°\u2022\-]\s+(.+)$/gm, '<li class="bullet">$1</li>');
    
    // Wrap consecutive bullet items in ul
    html = html.replace(/(<li class="bullet"[^>]*>[\s\S]*?<\/li>\n?)+/g, (match) => {
      return '<ul class="instruction-list bullet-list">' + match + '</ul>';
    });

    // Paragraphs (double newlines)
    html = html.replace(/\n\n/g, '</p><p>');
    
    // Single line breaks
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}