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
  transform(value: string): string {
    const div = document.createElement('div');
    div.innerHTML = value;
    return div.innerText || div.textContent || '';
  }
}