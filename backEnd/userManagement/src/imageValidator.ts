import sharp from 'sharp';

export class ImageValidator {
	public static async validate(fileData: any, requiredWidth: number, requiredHeight: number, maxSizeBytes: number): Promise<boolean> {
		let imageBuffer;
		let metaData;

		if (fileData.mimetype !== 'image/jpeg')
			return false;

		imageBuffer = await fileData.toBuffer();

		if (imageBuffer.length > maxSizeBytes) 
			return false;

		// try {
		// 	metaData = await sharp(imageBuffer).metadata();
		// 	if (metaData.width !== requiredWidth || metaData.height !== requiredHeight) 
		// 		return false;
			
		// } catch (error) {
		// 	return false;
		// }
		return true;
	}
}