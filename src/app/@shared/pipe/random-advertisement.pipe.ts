import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'randomAdvertisementUrl'
})
export class RandomAdvertisementUrlPipe implements PipeTransform {
  transform(advertisementDataList: any[], index: number): string {
    if (advertisementDataList?.length > 0) {
      const adjustedIndex = index % advertisementDataList.length;
      return advertisementDataList[adjustedIndex].imageUrl;
    }
    return '/assets/images/avtar/placeholder-user.png';
  }
}
