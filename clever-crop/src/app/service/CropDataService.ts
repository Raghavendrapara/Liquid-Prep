import { Inject, Injectable } from '@angular/core';
import { Observable, Observer, of } from 'rxjs';
import { Crop, Stage } from '../models/Crop';
import { ImageMapping } from '../models/ImageMapping';
import { DataService } from './DataService';
import { HttpClient } from '@angular/common/http';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import { SelectedCrop } from '../models/SelectedCrop';

const CROP_LIST_KEY = 'crop-list';
const CROPS_STORAGE_KEY = 'my-crops';
const SELECTED_CROP = 'selected-crop';

@Injectable({
  providedIn: 'root',
})
export class CropDataService {
  constructor(
    private http: HttpClient,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    private dataService: DataService
  ) {}

  private cropImageMappingFile = '/assets/json/cropImageMapping.json';
  private defaultImage = '../assets/crops-images/missing.jpg';
  private stageImageMappingFile = '../assets/json/cropGrowthStageImageMapping.json';

  public getCropsListData(): Observable<any> {
    return new Observable((observer: Observer<any>) => {
      this.dataService.getCropsList().subscribe((cropsList: any) => {
        const cropListData = cropsList.data.docs;
        if (cropListData) {
          cropListData.map((crop) => {
            crop.id = crop._id;
            this.fetchCropListImage(crop);
          });
          this.storeCropListInSession(cropListData);
          const filteredCropList = this.filterOutExistingCrops(cropListData);
          observer.next(filteredCropList);
          observer.complete();
        } else {
          observer.error('crops list is null or empty');
        }
      });
    });
  }

  public getCropData(id): Observable<any> {
    return new Observable((observer: Observer<any>) => {
      this.dataService.getCropInfo(id).subscribe((cropInfo: any) => {
        const cropData: Crop = cropInfo.data.docs[0];
        if (cropData) {
          cropData.id = cropInfo.data.docs[0]._id;
          this.fetchCropStageImages(cropData);
          observer.next(cropData);
          observer.complete();
        } else {
          observer.error('crops data is null or empty');
        }
      });
    });
  }

  public createSelectedCrop(crop: Crop, stage: Stage) {
    const selectedCrop = new SelectedCrop();
    selectedCrop.cropName = crop.cropName;
    selectedCrop.id = crop.id;
    selectedCrop.stage = stage;
    selectedCrop.imageUrl = crop.url;

    return selectedCrop;
  }

  // Storing selected crop in session to access later to generate water advise
  public storeSelectedCropInSession(selectedCrop: SelectedCrop) {
    if (selectedCrop) {
      this.sessionStorage.set(SELECTED_CROP, selectedCrop);
    }
  }

  public getSelectedCropFromSession() {
    return this.sessionStorage.get(SELECTED_CROP);
  }

  // store crops list in session storage
  public storeCropListInSession(cropsListData) {
    this.getCropListFromSessionStorage().subscribe((cropsList: Crop[]) => {
      if (cropsList === undefined || cropsList.length === 0) {
        this.sessionStorage.set(CROP_LIST_KEY, cropsListData);
      } else {
        console.log('crop list already stored in session storage.');
      }
    });
  }

  // check if crops list exits in session storage else return empty list
  public getCropListFromSessionStorage(): Observable<Crop[]> {
    return of(this.sessionStorage.get(CROP_LIST_KEY) || this.getEmptyMyCrops());
  }

  // check if my-crops list exists in local storage else return empty list
  public getMyCropsFromLocalStorage(): Observable<Crop[]> {
    return of(
      this.localStorage.get(CROPS_STORAGE_KEY) || this.getEmptyMyCrops()
    );
  }

  // check if my-crops list exists in local storage else return empty list
  public getMyCrops(): Observable<Crop[]> {
    return new Observable((observer: Observer<any>) => {
      let crops = [];
      this.getMyCropsFromLocalStorage().subscribe((myCrops: any) => {
        if (myCrops.length !== 0) {
          myCrops.map((crop) => {
            crop.id = crop._id;
            this.fetchCropListImage(crop);
          });
          crops = myCrops;
        }
        observer.next(crops);
        observer.complete();
      });
    });
  }

  // Filter out crops which are already existing in my-crops list stored locally
  public filterOutExistingCrops(cropsListData: Crop[]) {
    let filteredCropList = new Array<Crop>();
    this.getMyCrops().subscribe((storedCrops) => {
      if (storedCrops !== undefined || storedCrops.length !== 0) {
        storedCrops.forEach((eachStoredCrop) => {
          cropsListData.forEach((eachCropData, index) => {
            if (eachCropData.id === eachStoredCrop.id) {
              cropsListData.splice(index, 1);
            }
          });
        });
        filteredCropList = cropsListData;
      } else {
        filteredCropList = cropsListData;
      }
    });
    return filteredCropList;
  }

  public storeMyCropsInLocalStorage(crop: Crop) {
    const cropsData = new Array<Crop>();
    this.getMyCrops().subscribe((myCrops) => {
      // If the crops list is empty in local storage then store the crop
      // Else store the crop if its not already existing.
      if (myCrops.length === 0) {
        cropsData.push(crop);
        this.localStorage.set(CROPS_STORAGE_KEY, cropsData);
      } else {
        myCrops.forEach((eachCrop) => {
          if (crop.id !== eachCrop.id) {
            myCrops.push(crop);
            this.localStorage.remove(CROPS_STORAGE_KEY);
            this.localStorage.set(CROPS_STORAGE_KEY, myCrops);
          }
        });
      }
    });
  }

  public deleteMyCrop(cropId) {
    this.getMyCropsFromLocalStorage().subscribe((myCrops) => {
      myCrops.forEach((crop, index) => {
        if (crop.id === cropId) {
          myCrops.splice(index, 1);
          this.localStorage.remove(CROPS_STORAGE_KEY);
          this.localStorage.set(CROPS_STORAGE_KEY, myCrops);
        }
      });
    });
  }

  public getCropImageMapping(): Observable<ImageMapping> {
    return new Observable((observer: Observer<ImageMapping>) => {
      this.http
        .get<ImageMapping>(this.cropImageMappingFile)
        .subscribe((data) => {
          observer.next(data);
          observer.complete();
        });
    });
  }

  public getCropGrowthStageImageMapping(): Observable<ImageMapping> {
    return new Observable((observer: Observer<ImageMapping>) => {
      this.http
        .get<ImageMapping>(this.stageImageMappingFile)
        .subscribe((data) => {
          observer.next(data);
          observer.complete();
        });
    });
  }

  private fetchCropStageImages(crop: Crop) {
    this.getCropGrowthStageImageMapping().subscribe(
      (cropGrowthStageImageMapping: ImageMapping) => {
        if (cropGrowthStageImageMapping != null) {
          if (crop.cropGrowthStage) {
            crop.cropGrowthStage.stages.forEach((stage) => {
              const stageUrl =
                cropGrowthStageImageMapping.cropStageMap[
                  stage.stageNumber.toString()
                ].url;
              stage.url = stageUrl;
            });
          }
        } else {
          if (crop.cropGrowthStage) {
            crop.cropGrowthStage.stages.forEach((stage) => {
              const stageUrl =
                '../assets/crops-images/stage' + stage.stageNumber + '.png';
              stage.url = stageUrl;
            });
          }
        }
      }
    );
  }

  private fetchCropListImage(crop: Crop) {
    this.getCropImageMapping().subscribe((cropImageMapping: ImageMapping) => {
      if (cropImageMapping != null && cropImageMapping.cropsMap[crop.id]) {
        crop.url = cropImageMapping.cropsMap[crop.id].url;
      } else {
        crop.url = this.defaultImage;
      }
    });
  }

  private getEmptyMyCrops(): Crop[] {
    const emptyArray: Crop[] = [];
    return emptyArray;
  }
}
