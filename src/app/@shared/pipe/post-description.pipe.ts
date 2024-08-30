import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number): string {
    if (limit === -1 || value.length <= limit) {
      return value;
    }
    return value.substring(0, limit) + '...';
  }
}
@Pipe({
  name: 'stripHtml'
})
export class StripHtmlPipe implements PipeTransform {
  // transform(value: string): string {
  //   const div = document.createElement('div');
  //   div.innerHTML = value;
  //   if (div.querySelector('[data-id]')) {
  //     return div.innerHTML;
  //   }
  //   return div.innerText || div.textContent || '';
  // }
  transform(value: string): string {
    const div = document.createElement('div');
    div.innerHTML = value;
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('data-id')) {
          return element.outerHTML;
        } else {
          return Array.from(element.childNodes).map(processNode).join('');
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      return '';
    };
    const result = processNode(div);
    return result || div.textContent || '';
  }
}