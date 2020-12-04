export class CropStageInfo {
    public stage: string;
    public stageNumber: number;
    public waterUseMax: number;
    public waterUseMin: number;
} 

export class CropGrowthStageInfo {
    public numberOfStages: number;
    public stages: CropStageInfo[];
    public waterMeasurementMetric: string;
    public waterUsage: string;
}

export class CropInformation {

    public cropType: string;
    public cropGrowthStage: CropGrowthStageInfo;
    public cropName: string;
    public index: number;
    public id: string;
    public uniqueId: string;

    constructor(
        cropType: string,
        cropGrowthStage: CropGrowthStageInfo,
        cropName: string,
        index: number,
        id: string,
        uniqueId: string
    ) {
        this.cropType = cropType;
        this.cropGrowthStage = cropGrowthStage;
        this.cropName = cropName;
        this.index = index;
        this.id = id;
        this.uniqueId = uniqueId;
    }

}