import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messageDate'
})
export class MessageDatePipe implements PipeTransform {
  transform(messages: any[]): any[] {
    const groupedMessages: any[] = [];

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let groupHeader = '';

      if (messageDate.toDateString() === today.toDateString()) {
        groupHeader = 'Today';
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        groupHeader = 'Yesterday';
      } else {
        groupHeader = messageDate.toLocaleDateString(); // or any other desired date format
      }

      if (index === 0 || messageDate.toDateString() !== new Date(messages[index - 1].createdDate).toDateString()) {
        groupedMessages.push({ date: groupHeader, messages: [message] });
      } else {
        groupedMessages[groupedMessages.length - 1].messages.push(message);
      }
    });
    return groupedMessages;
  }
}
