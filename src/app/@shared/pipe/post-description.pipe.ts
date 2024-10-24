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
    return `${value}`
      .replace(/<div[^>]*>\s*/gi, '<div>')
      .replace(/<br[^>]*>\s*/gi, '<br>')
      .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
      .replace(/(?:<div><br><\/div>\s*)+/gi, '<div><br></div>')
      .replace(/<a\s+([^>]*?)>/gi, (match, p1) => {
        const hrefMatch = p1.match(/\bhref=["'][^"']*["']/);
        const classMatch = p1.match(/\bclass=["'][^"']*["']/);
        const dataIdMatch = p1.match(/\bdata-id=["'][^"']*["']/);
        let allowedAttrs = '';
        if (hrefMatch) allowedAttrs += ` ${hrefMatch[0]}`;
        if (classMatch) allowedAttrs += ` ${classMatch[0]}`;
        if (dataIdMatch) allowedAttrs += ` ${dataIdMatch[0]}`;
        return `<a${allowedAttrs}>`;
      })
      .replace(/<\/?[^>]+(>|$)/gi, (match) => {
        return /<\/?(a|br|div)(\s+[^>]*)?>/i.test(match) ? match : '';
      })
      .replace(/^(?:&nbsp;|\s)+/g, '')
      .trim();
  }
}