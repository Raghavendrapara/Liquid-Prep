import { CropInformation } from "src/models/cropInformation";
import { CloudantDBService } from "./cloudant/cloudantDBService";
import { CropsList } from '../models/cropsList';

export class CropDataService {

    public getCropInfo(params) {
        //let cropInfo = new CloudantDBService(params).getCropInfo();
        let cloudantDBService = new CloudantDBService(params);
        cloudantDBService.getCropInfo().subscribe(cropInfo => {
            let cropData = new CropInformation(
                cropInfo.type,
                cropInfo.cropGrowthStage,
                cropInfo.cropName,
                cropInfo.index,
                cropInfo._id,
                cropInfo._rev);
            return cropData;
        })
        
    }

    public getCropsList(params) {
        let cropsListData = new CloudantDBService(params).getCropList();
        let cropsList = new CropsList(cropsListData);
        return cropsList;
    }
}