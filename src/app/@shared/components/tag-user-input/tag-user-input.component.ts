import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from '../../services/customer.service';
import { PostService } from '../../services/post.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedService } from '../../services/shared.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { MessageService } from '../../services/message.service';
import { EmojiPaths } from '../../constant/emoji';

@Component({
  selector: 'app-tag-user-input',
  templateUrl: './tag-user-input.component.html',
  styleUrls: ['./tag-user-input.component.scss'],
})
export class TagUserInputComponent implements OnChanges, OnDestroy {
  @Input('value') value: string = '';
  @Input('placeholder') placeholder: string = 'ss';
  @Input('isShowMetaPreview') isShowMetaPreview: boolean = true;
  @Input('isCopyImagePreview') isCopyImagePreview: boolean = true;
  @Input('isAllowTagUser') isAllowTagUser: boolean = true;
  @Input('isShowMetaLoader') isShowMetaLoader: boolean = true;
  @Input('isShowEmojis') isShowEmojis: boolean = false;
  @Input('isCustomeSearch') isCustomeSearch: number = null;
  @Output('onDataChange') onDataChange: EventEmitter<any> =
    new EventEmitter<any>();

  @ViewChild('tagInputDiv', { static: false }) tagInputDiv: ElementRef;
  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;
  @Input() placement: string = 'bottom-end';
  metaDataSubject: Subject<void> = new Subject<void>();

  userList = [];
  userNameSearch = '';
  metaData: any = {};
  isMetaLoader: boolean = false;

  copyImage: any;

  emojiPaths = EmojiPaths;
  profileId: number;

  constructor(
    private renderer: Renderer2,
    private customerService: CustomerService,
    private postService: PostService,
    private spinner: NgxSpinnerService,
    private sharedService: SharedService,
    private messageService: MessageService
  ) {
    this.metaDataSubject.pipe(debounceTime(5)).subscribe(() => {
      this.getMetaDataFromUrlStr();
      this.checkUserTagFlag();
    });
    this.sharedService.loggedInUser$.subscribe((data) => {
      this.profileId = data?.profileId;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const val = changes?.value?.currentValue;
    this.setTagInputDivValue(val);

    if (val === '') {
      this.clearUserSearchData();
      this.clearMetaData();
      this.onClearFile();
    } else {
      this.getMetaDataFromUrlStr();
      this.checkUserTagFlag();
    }
    // this.moveCursorToEnd()
  }

  ngOnDestroy(): void {
    this.metaDataSubject.next();
    this.metaDataSubject.complete();
  }

  messageOnKeyEvent(): void {
    this.metaDataSubject.next();
    this.emitChangeEvent();
  }

  // checkUserTagFlag1(): void {
  //   if (this.isAllowTagUser) {
  //     const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';

  //     const atSymbolIndex = htmlText.lastIndexOf('@');

  //     if (atSymbolIndex !== -1) {
  //       this.userNameSearch = htmlText.substring(atSymbolIndex + 1);
  //       if (this.userNameSearch?.length > 2) {
  //         this.getUserList(this.userNameSearch);
  //       } else {
  //         this.clearUserSearchData();
  //       }
  //     } else {
  //       this.clearUserSearchData();
  //     }
  //   }
  // }
  checkUserTagFlag(): void {
    this.userList = [];
    if (this.isAllowTagUser) {
      let htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
  
      // Remove HTML tags to get the clean text content
      htmlText = htmlText.replace(/<[^>]*>/g, '');
  
      const atSymbolRegex = /@/g;
      const matches = [...htmlText.matchAll(atSymbolRegex)];
      const cursorPosition = this.getCursorPosition(); // Get cursor position
  
      if (matches.length > 0) {
        // Iterate through all the @ matches
        for (const match of matches) {
          const atSymbolIndex = match.index;
  
          // Only check the text between the @ symbol and the cursor
          if (cursorPosition > atSymbolIndex) {
            const currentPositionValue = htmlText
              .substring(atSymbolIndex + 1, cursorPosition) // Text after @ up to cursor
              .trim(); // Remove extra spaces
  
            // Proceed if there is actual content typed after the @ symbol
            if (currentPositionValue.length > 0) {
              this.userNameSearch = currentPositionValue; // This is the user name search text
              console.log('username:', this.userNameSearch);
            }
          }
        }
  
        // After checking for @ and capturing the text, proceed to fetch user list
        if (this.userNameSearch && this.userNameSearch.length > 2) {
          this.getUserList(this.userNameSearch); // Fetch the user list based on search
        } else {
          this.clearUserSearchData(); // Clear the search data if the input is too short
        }
      } else {
        console.log('No "@" symbol found.');
      }
    }
  }
  
  

  // Method to get the cursor position
  getCursorPosition(): number {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange(); // Create a clone of the current selection range
      preCaretRange.selectNodeContents(this.tagInputDiv.nativeElement); // Select the contents of the contenteditable div
      preCaretRange.setEnd(range.endContainer, range.endOffset); // Set the end to the current selection position
      return preCaretRange.toString().length; // Return the length of the text up to the cursor position
    }
    return -1; // If no selection, return -1
  }

  getMetaDataFromUrlStr(): void {
    const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
    this.extractImageUrlFromContent(htmlText);
    if (htmlText === '') {
      this.onClearFile();
    }

    const text = htmlText.replace(/<br\s*\/?>|<[^>]*>/g, ' ');
    const extractedLinks = [
      ...htmlText.matchAll(
        /<a\s+(?![^>]*\bdata-id=["'][^"']*["'])[^>]*?href=["']([^"']*)["']/gi
      ),
    ].map((match) => match[1]);
    // const matches = text?.match(/(?:https?:\/\/|www\.)[^\s<]+(?:\s|<br\s*\/?>|$)/);
    const matches = text.match(
      /(?:https?:\/\/|www\.)[^\s<&]+(?:\.[^\s<&]+)+(?:\.[^\s<]+)?/g
    );
    const url = matches?.[0] || extractedLinks?.[0];
    if (url) {
      if (url !== this.metaData?.url) {
        // this.isMetaLoader = true;
        // this.spinner.show();
        const unsubscribe$ = new Subject<void>();
        this.postService
          .getMetaData({ url })
          .pipe(takeUntil(unsubscribe$))
          .subscribe({
            next: (res: any) => {
              this.isMetaLoader = false;
              this.spinner.hide();
              if (res?.meta?.image) {
                const urls = res.meta?.image?.url;
                const imgUrl = Array.isArray(urls) ? urls?.[0] : urls;

                const metatitles = res?.meta?.title;
                const metatitle = Array.isArray(metatitles)
                  ? metatitles?.[0]
                  : metatitles;

                const metaurls = res?.meta?.url || url;
                const metaursl = Array.isArray(metaurls)
                  ? metaurls?.[0]
                  : metaurls;

                this.metaData = {
                  title: metatitle,
                  metadescription: res?.meta?.description,
                  metaimage: imgUrl,
                  metalink: metaursl,
                  url: url,
                };

                this.emitChangeEvent();
              } else {
                this.metaData.metalink = url;
              }
              this.spinner.hide();
            },
            error: () => {
              if (this.metaData.metalink === null || '') {
                this.metaData.metalink = url;
              }
              this.isMetaLoader = false;
              // this.clearMetaData();
              this.spinner.hide();
            },
            complete: () => {
              unsubscribe$.next();
              unsubscribe$.complete();
            },
          });
      }
    } else {
      this.clearMetaData();
      this.isMetaLoader = false;
    }
  }

  moveCursorToEnd(): void {
    const range = document.createRange();
    const selection = window.getSelection();
    const tagInputDiv = this.tagInputDiv?.nativeElement;
    if (tagInputDiv && tagInputDiv.childNodes.length > 0) {
      range.setStart(
        this.tagInputDiv?.nativeElement,
        this.tagInputDiv?.nativeElement.childNodes.length
      );
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // selectTagUser(user: any): void {
  //   const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
  //   // const text = htmlText.replace(
  //   //   `@${this.userNameSearch}`,
  //   //   `<a href="/settings/view-profile/${user?.Id
  //   //   }" class="text-danger" data-id="${user?.Id}">@${user?.Username.split(
  //   //     ' '
  //   //   ).join('')}</a>`
  //   // );
  //   const replaceUsernamesInTextNodes = (
  //     html: string,
  //     userName: string,
  //     userId: string,
  //     displayName: string
  //   ) => {
  //     const parser = new DOMParser();
  //     const doc = parser.parseFromString(html, 'text/html');
  //     const walk = (node: Node) => {
  //       if (node.nodeType === Node.TEXT_NODE) {
  //         // const regex = /@/g;
  //         const regex = /@(\w*)/g;
  //         const replacement = `<a href="/settings/view-profile/${userId}" class="text-danger" data-id="${userId}">@${displayName}</a>`;
  //         let replacedText = node.nodeValue?.replace(regex, replacement);
  //         const textRegex = new RegExp(`(?<=<\/a>)${userName}`, 'g');
  //         replacedText = replacedText?.replace(textRegex, '');
  //         if (replacedText !== node.nodeValue) {
  //           const span = document.createElement('span');
  //           span.innerHTML = replacedText!;
  //           while (span.firstChild) {
  //             node.parentNode?.insertBefore(span.firstChild, node);
  //           }
  //           node.parentNode?.removeChild(node);
  //         }
  //       } else if (
  //         node.nodeType === Node.ELEMENT_NODE &&
  //         node.nodeName.toLowerCase() !== 'a'
  //       ) {
  //         node.childNodes.forEach((child) => walk(child));
  //       }
  //     };
  //     doc.body.childNodes.forEach((child) => walk(child));
  //     return doc.body.innerHTML;
  //   };
  //   const text = replaceUsernamesInTextNodes(
  //     htmlText,
  //     this.userNameSearch,
  //     user?.Id,
  //     user?.Username.split(' ').join('')
  //   );
  //   this.setTagInputDivValue(text);
  //   this.emitChangeEvent();
  //   this.moveCursorToEnd();
  // }

  selectTagUser(user: any): void {
    const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';

    // Save the cursor position
    const savedRange = this.saveCursorPosition();

    const replaceUsernamesInTextNodesAtCursor = (
      html: string,
      userName: string,
      userId: string,
      displayName: string
    ) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const cursorPosition = this.getCursorPosition(); // Get the cursor position in the text

          // Find the nearest @ mention before the cursor
          const regex = /@/g;
          const match = regex.exec(node.nodeValue || '');

          if (match && match.index <= cursorPosition) {
            const atSymbolIndex = match.index;

            // Replace only at the position of the found @ mention
            const replacement = `<a href="/settings/view-profile/${userId}" class="text-danger" data-id="${userId}">@${displayName}</a>`;
            const beforeText = node.nodeValue?.substring(0, atSymbolIndex);
            const afterText = node.nodeValue?.substring(cursorPosition);

            // Replace @ mention with the link
            const replacedText = `${beforeText}${replacement}${afterText}`;
            const span = document.createElement('span');
            span.innerHTML = replacedText;

            // Insert the new HTML in place of the text node
            while (span.firstChild) {
              node.parentNode?.insertBefore(span.firstChild, node);
            }
            node.parentNode?.removeChild(node);
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName.toLowerCase() !== 'a'
        ) {
          node.childNodes.forEach((child) => walk(child));
        }
      };

      doc.body.childNodes.forEach((child) => walk(child));
      return doc.body.innerHTML;
    };

    // Call the function to replace @ mention at the current cursor position
    const text = replaceUsernamesInTextNodesAtCursor(
      htmlText,
      this.userNameSearch,
      user?.Id,
      user?.Username.split(' ').join('')
    );
    this.setTagInputDivValue(text);
    this.restoreCursorPosition(savedRange);
    this.emitChangeEvent();
    this.moveCursorToEnd();
  }

  saveCursorPosition(): Range | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange(); // Clone the range to save it
    }
    return null;
  }

  // Restore saved cursor position
  restoreCursorPosition(savedRange: Range | null): void {
    if (savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges(); // Clear any existing ranges
      selection.addRange(savedRange); // Restore the saved range
    }
  }

  selectEmoji(emoji: any): void {
    let htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
    htmlText = htmlText.replace(/^(<br\s*\/?>)+/i, '');
    const text = `${htmlText}<img src=${emoji} width="50" height="50">`;
    this.setTagInputDivValue(text);
    this.emitChangeEvent();
  }

  getUserList(search: string): void {
    if (this.isCustomeSearch) {
      this.messageService
        .getRoomProfileList(search, this.isCustomeSearch)
        .subscribe({
          next: (res: any) => {
            if (res?.data?.length > 0) {
              this.userList = res.data.filter(
                (user) => user.Id !== this.profileId
              );
            } else {
              this.clearUserSearchData();
            }
          },
          error: () => {
            this.clearUserSearchData();
          },
        });
    } else {
      this.customerService.getProfileList(search).subscribe({
        next: (res: any) => {
          if (res?.data?.length > 0) {
            this.userList = res.data.map((e) => e);
            // this.userSearchNgbDropdown.open();
          } else {
            this.clearUserSearchData();
          }
        },
        error: () => {
          this.clearUserSearchData();
        },
      });
    }
  }

  clearUserSearchData(): void {
    this.userNameSearch = '';
    this.userList = [];
    // this.userSearchNgbDropdown?.close();
  }

  clearMetaData(): void {
    this.metaData = {};
    this.emitChangeEvent();
  }

  setTagInputDivValue(htmlText: string): void {
    if (this.tagInputDiv) {
      this.renderer.setProperty(
        this.tagInputDiv.nativeElement,
        'innerHTML',
        htmlText
      );
    }
  }

  handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData =
      event.clipboardData?.getData('text/html') ||
      event.clipboardData?.getData('text/plain');
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const items = clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event: any) => {
            const base64Image = event.target.result;
            const imgTag = `<img src="${base64Image}" alt="Pasted Image" />`;
            document.execCommand('insertHTML', false, imgTag);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    }
    if (pastedData) {
      const isPlainText = !/<[^>]+>/.test(pastedData);
      if (isPlainText) {
        document.execCommand('insertText', false, pastedData);
        return;
      }
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.cleanPastedData(pastedData);
      this.removeInlineStyles(tempDiv);
      document.execCommand('insertHTML', false, tempDiv.innerHTML);
    }
  }
  cleanPastedData(data: string): string {
    return data
      .replace(/<!--.*?-->/gs, '') // Remove all HTML comments
      .replace(/<!DOCTYPE.*?>/gs, '') // Remove DOCTYPE declarations
      .replace(/<xml.*?<\/xml>/gs, '') // Remove XML tags and their content
      .replace(/<o:.*?<\/o:.+?>/gs, '') // Remove specific Office tags
      .replace(/<w:.*?>.*?<\/w:.+?>/gs, '') // Remove Word-specific tags
      .replace(/<m:.*?>.*?<\/m:.+?>/gs, '') // Remove Math-specific tags
      .replace(/<!--[if.*?]>([\s\S]*?)<!\[endif]-->/gs, '') // Remove conditional comments
      .replace(/<w:LatentStyles.*?<\/w:LatentStyles>/gs, '') // Remove specific LatentStyles tag
      .replace(/<style.*?<\/style>/gs, '') // Remove <style> tags and their content
      .trim(); // Trim any extra whitespace
  }
  removeInlineStyles(element: HTMLElement) {
    const elementsWithStyle = element.querySelectorAll('[style]');
    for (let i = 0; i < elementsWithStyle.length; i++) {
      elementsWithStyle[i].removeAttribute('style');
    }

    const tagsToConvert = [
      'B', // Bold
      'I', // Italic
      'U', // Underline
      'STRONG', // Strong
      'EM', // Emphasis
      'MARK', // Marked text
      'SMALL', // Small text
      'S', // Strikethrough
      'DEL', // Deleted text
      'INS', // Inserted text
      'SUB', // Subscript
      'SUP', // Superscript
    ];
    tagsToConvert.forEach((tag) => {
      const elements = element.getElementsByTagName(tag);
      const elementsArray = Array.from(elements);
      elementsArray.forEach((el) => {
        const span = document.createElement('span');
        span.innerHTML = el.innerHTML;
        el.parentNode?.replaceChild(span, el);
      });
    });
  }

  emitChangeEvent(): void {
    if (this.tagInputDiv) {
      const htmlText = this.tagInputDiv?.nativeElement?.innerHTML;
      this.value = `${htmlText}`
        .replace(/<br[^>]*>\s*/gi, '<br>')
        .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
        .replace(/(?:<div><br><\/div>\s*)+/gi, '<div><br></div>')
        .replace(
          /<a\s+(?![^>]*\bdata-id=["'][^"']*["'])[^>]*>(.*?)<\/a>/gi,
          '$1'
        );
      this.onDataChange?.emit({
        html: this.value,
        tags: this.tagInputDiv?.nativeElement?.children,
        meta: this.metaData,
      });
    }
  }

  extractImageUrlFromContent(content: string): string | null {
    const contentContainer = document.createElement('div');
    contentContainer.innerHTML = content;
    const imgTag = contentContainer.querySelector('img');

    if (imgTag) {
      // const tagUserInput = document.querySelector('.tag-input-div') as HTMLInputElement;
      // if (tagUserInput) {tagUserInput.focus()}
      const imgTitle = imgTag.getAttribute('title');
      const imgStyle = imgTag.getAttribute('style');
      const imageGif = imgTag
        .getAttribute('src')
        .toLowerCase()
        .endsWith('.gif');
      if (!imgTitle && !imgStyle && !imageGif) {
        this.copyImage = imgTag.getAttribute('src');
      }
    }
    return null;
  }

  onClearFile() {
    this.copyImage = null;
  }
}
