export class CropsListData {
    public _id: string;
}

export class CropsList {
    public cropsList: CropsListData[];

    constructor(cropsList: CropsListData[]){
        this.cropsList = cropsList;
    }
}