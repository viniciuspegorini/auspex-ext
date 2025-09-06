import asyncio
from zipfile import ZipFile
from js import document, window # type: ignore
import os

async def main():
    print('Loading libs...')
    import micropip # type: ignore
    await micropip.install("numpy")
    await micropip.install("matplotlib")
    await micropip.install("scipy")
    await micropip.install("requests")
    await micropip.install("mini-auspex")

    with ZipFile('data/SDH40mmPA_FMC_Contact.civa.zip', 'r') as zip_civa:
        zip_civa.extractall('loaded-data')

    with ZipFile('data/Velichko2018_figure2.civa.zip', 'r') as zip_civa:
        zip_civa.extractall('loaded-data')

    with ZipFile('data/Zhang2010_crack_5mm.civa.zip', 'r') as zip_civa:
        zip_civa.extractall('loaded-data')

    with ZipFile('data/Zhang2010_slot01.civa.zip', 'r') as zip_civa:
        zip_civa.extractall('loaded-data')

    with ZipFile('data/Zhang2010_slot02.civa.zip', 'r') as zip_civa:
        zip_civa.extractall('loaded-data')

    with ZipFile('data/Zhang2010_slot03.civa.zip', 'r') as zip_civa:
        zip_civa.extractall('loaded-data')

    with ZipFile('data/Zhang2010_slot04.civa.zip', 'r') as zip_civa:
        zip_civa.extractall('loaded-data')

    fileList = os.listdir('loaded-data')
        # print(fileList)
    files = ''
    filesStr = '['
    for file in fileList:
        if filesStr != '[':
            filesStr += ','
        filesStr += '"' + file + '"'
        # files += ' <FormControlLabel value="' + file + '" control={<Radio />} label="' + file + '" /> '
        files += '<input onChange={handleFileSelectChange} type="radio" id="file_list" name="file_list" value="' + file + '"><label for="file_list">' + file + '</label> '
    filesStr += ']'
    window.localStorage.removeItem('fileList')
    window.localStorage.setItem('fileList', filesStr)
    # document.getElementById("file-list").innerHTML = files
    window.updateFileList()
    print('Libs loaded!')
    await asyncio.sleep(1)

asyncio.ensure_future(main())
