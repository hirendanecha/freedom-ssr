import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number): string {
    if (limit === -1 || value?.length <= limit) {
      return value;
    }
    return value?.substring(0, limit) + '...';
  }
}
@Pipe({
  name: 'stripHtml'
})
export class StripHtmlPipe implements PipeTransform {
  transform(value: string): string {
    const div = document.createElement('div');
    div.innerHTML = value;
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'a' && element.hasAttribute('data-id')) {
          return element.outerHTML;
        }
        Array.from(element.attributes).forEach(attr => element.removeAttribute(attr.name));
        const childContent = Array.from(element.childNodes)
          .map(processNode)
          .join('');
        if (tagName === 'br') {
          return '<br>';
        }
        if (tagName === 'div') {
          return `<div>${childContent}</div>`;
        }
        return `<${tagName}>${childContent}</${tagName}>`;
      } else if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      return '';
    };
    const result = processNode(div);
    const normalizedResult = result
      .replace(/(?:<div><br><\/div>\s*)+/gi, '<div><br></div>')
      .replace(/(\n\s*)+/g, '\n')
      .trim();
    return normalizedResult;
  }
}