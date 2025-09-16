import asyncio
from zipfile import ZipFile
from pyodide.ffi import create_proxy
from js import document, Uint8Array, localStorage, window
import os
from os.path import exists
import io

async def process_file(event):
    window.blockUI(True, 'Loading file...')
    await asyncio.sleep(1)
    fileList = event.target.files.to_py()
    if fileList.length == 0:
        window.blockUI(False, 'No file selected!')
        return

    file_name = ''
    for f in fileList:
        print("f.name:" + f.name)
        file_name = f.name
        fileData = Uint8Array.new(await f.arrayBuffer())
        # Store the file in the virtual filesystem
        with open("b.zip","wb") as outb:
            outb.write(bytearray(fileData))
        # Extract the file from the virtual filesystem
        with ZipFile("b.zip", 'r') as zip_civa:
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

    print('SET SELECTED FILE')
    index = file_name.rindex(".")
    file_name = file_name[:index]
    window.updateFileList(file_name)

    print('LOAD DATA')
    global data
    data = await get_data(file_name)

    window.blockUI(False, 'Finished!')
    await asyncio.sleep(1)
    # document.getElementById("file-list").innerHTML = files

async def main():
    print('main - load_files.py')
    # Create a Python proxy for the callback function
    # process_file() is your function to process events from FileReader
    file_event = create_proxy(process_file)

	# Set the listener to the callback
    e = document.getElementById("file-selector")
    e.addEventListener("change", file_event, False)

asyncio.ensure_future(main())
