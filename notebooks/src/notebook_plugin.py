import asyncio
from js import window
from pyscript import Plugin # A base class for plugins

class NotebookPlugin(Plugin): # The name of the class is unimportant
    async def beforePyReplExec(self, interpreter, outEl, src, pyReplTag):
        window.blockUI(True, 'Processing notebook...')
        await asyncio.sleep(1)
        

    async def afterPyReplExec(self, interpreter, src, outEl, pyReplTag, result):
        window.blockUI(False, 'Finished.')
        await asyncio.sleep(1)

plugin = NotebookPlugin()