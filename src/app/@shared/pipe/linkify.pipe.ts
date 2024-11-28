import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'linkify'
})
export class LinkifyPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return value;

    const urlRegex = /(?:https?:\/\/|www\.)[^\s<&]+(?:\.[^\s<&]+)+(?:\.[^\s<]+)?/g;
    return value.replace(urlRegex, (url) => {
      if (url.startsWith('www') && !/^https?:\/\//.test(url)) {
        url = 'http://' + url;
      }
      const gif = url.trim().replace(/["']/g, '');
      if (gif.endsWith('.gif')) {
        return url;
      }
      return `<a href="${url}">${url}</a>`;
    });
  }
}
