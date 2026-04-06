/**
 * @fileoverview
 * functions that are used to pull information out of error responees
 */

/**
 * A function that will do its best to find some kind of text to return as
 * an error message. Checks that the status text is >= 400
 * @param res Response
 * @param lookForKey optional key that could be looked for
 * @returns 
 */
export async function TryExtractingError(res: Response, lookForKey?:string){
    if(res.status < 399) return 'This is not an error';
    const b = await res.text();
    let data: string | {[key:string]:string};
    try {
        data = JSON.parse(b) as {[key:string]:string};
        if (!!lookForKey && lookForKey in data) data = `${data[lookForKey]}`; 
        else if('message' in data) data = data['message'];
        else if('msg' in data) data = data['msg'];
        else if('err' in data) data = data['err'];
        else if('error' in data) data = data['error'];
        else data = '';
    } catch (_) {
        // We know the issue is not valid json
        data = b;
    }
    if (data.length < 5) return res.statusText;
    else return data;
}