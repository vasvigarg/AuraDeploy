"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadS3Folder = downloadS3Folder;
exports.copyFinalDist = copyFinalDist;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("stream/promises");
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: "d1fa9ede7ec0c452989b3d8250ae3356",
        secretAccessKey: "84a5226dc2fd3ed9f01d7fb1f0e8c929392407fd826f77bd1c52ed6a022293f0",
    },
    endpoint: "https://a5a0040c5bca269c0e703f855af0ee8f.r2.cloudflarestorage.com",
    region: "auto",
});
function downloadS3Folder(prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: "aura-deploy",
                Prefix: prefix,
            });
            const allFiles = yield s3Client.send(command);
            const allPromises = ((_a = allFiles.Contents) === null || _a === void 0 ? void 0 : _a.map((_a) => __awaiter(this, [_a], void 0, function* ({ Key }) {
                if (!Key)
                    return;
                const finalOutputPath = path_1.default.join(__dirname, Key);
                const dirName = path_1.default.dirname(finalOutputPath);
                if (!fs_1.default.existsSync(dirName)) {
                    fs_1.default.mkdirSync(dirName, { recursive: true });
                }
                const getObjectCommand = new client_s3_1.GetObjectCommand({
                    Bucket: "aura-deploy",
                    Key,
                });
                const response = yield s3Client.send(getObjectCommand);
                const outputFile = fs_1.default.createWriteStream(finalOutputPath);
                if (response.Body) {
                    yield (0, promises_1.pipeline)(response.Body, outputFile);
                }
            }))) || [];
            console.log("awaiting");
            yield Promise.all(allPromises);
        }
        catch (error) {
            console.error("Error downloading S3 folder:", error);
            throw error;
        }
    });
}
function copyFinalDist(id) {
    const folderPath = path_1.default.join(__dirname, `output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);
    allFiles.forEach((file) => {
        uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
    });
}
const getAllFiles = (folderPath) => {
    let response = [];
    const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullFilePath = path_1.default.join(folderPath, file);
        if (fs_1.default.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        }
        else {
            response.push(fullFilePath);
        }
    });
    return response;
};
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileContent = fs_1.default.readFileSync(localFilePath);
        const upload = new lib_storage_1.Upload({
            client: s3Client,
            params: {
                Bucket: "aura-deploy",
                Key: fileName,
                Body: fileContent,
            },
        });
        const response = yield upload.done();
        console.log(response);
    }
    catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
});
