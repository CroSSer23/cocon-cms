import { Injectable } from "@angular/core";
// import * as S3 from 'aws-sdk/clients/s3';
import { environment } from "src/environments/environment";

@Injectable()
export class ImageService {
    key: string;

    constructor() { }
    // uploadImage(file, Name) {
    //     return new Promise(async (resolve, rejects) => {
    //         const s3 = new S3({
    //             accessKeyId: environment.BUCKET_ACCESS_KEY_ID,
    //             secretAccessKey: environment.BUCKET_SECRET_ACCESS_KEY,
    //             region: environment.BUCKET_REGION
    //         });
    //         const params = {
    //             Bucket: 'cocon-images',
    //             Key: Name,
    //             Body: file,
    //             ACL: 'public-read',
    //             ContentType: file.type
    //         };
    //         var key = await s3.upload(params).promise();
    //         // await s3.upload(params).promise().then(data => {
    //         //     this.key = data.Key;
    //         // });
    //         resolve(key.Key);
    //     });
    // }

    getImageUrl(key) {
        return environment.BUCKET_URL + key;
    }

    //     <?xml version="1.0" encoding="UTF-8"?>
    // <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    // <CORSRule>
    //     <AllowedOrigin>*</AllowedOrigin>
    //     <AllowedMethod>GET</AllowedMethod>
    //     <AllowedMethod>POST</AllowedMethod>
    //     <AllowedMethod>PUT</AllowedMethod>
    //     <AllowedMethod>DELETE</AllowedMethod>
    //     <AllowedHeader>*</AllowedHeader>
    // </CORSRule>
    // </CORSConfiguration>
    // getImgUrl(key) {
    //     return new Promise(async (resolve, rejects) => {
    //         console.log('*******getImgUrl()*******');
    //         let url: string;
    //         const s3 = new S3({
    //             accessKeyId: 'REDACTED_AWS_KEY_ID',
    //             secretAccessKey: 'REDACTED_AWS_SECRET',
    //             region: 'us-east-1'
    //         });
    //         const params = {
    //             Bucket: 'imagemetadata',
    //             Key: key,
    //         };
    //         // const data = s3.putObject(params).promise();
    //         // console.log(data);
    //         url = s3.getSignedUrl('getObject', params);
    //         resolve(url);
    //     });
    // }

    // deleteImage(key: string) {
    //     return new Promise(async (resolve, rejects) => {
    //         console.log('*******deleteImage()*******');
    //         let url: string;
    //         const s3 = new S3({
    //             accessKeyId: 'REDACTED_AWS_KEY_ID',
    //             secretAccessKey: 'REDACTED_AWS_SECRET',
    //             region: 'us-east-1'
    //         });
    //         const deleteParams = {
    //             Bucket: 'imagemetadata',
    //             Key: key,
    //         };
    //         // const data = s3.putObject(params).promise();
    //         // console.log(data);
    //         s3.deleteObject(deleteParams, (err, data) => {
    //             if (err) console.log(err, err.stack);
    //             else console.log('delete data', data);
    //         })
    //         resolve(true);
    //     });
    // }
}