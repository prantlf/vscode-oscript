---
name: Problem encountered
about: Report information that could help fixing a bug in the OScript support
title: ''
labels: ''
assignees: ''
---

**What is the version of `vscode-oscript` that you use?**

You can find the extension information in the Extensions side bar (`Cmd+Shift+X`) by searching for "@installed oscript".

**What does not work or work unexpectedly?**

Explain what does not work as you would expect. You can attach screenshots too.

**How do you expect it to work?**

Describe what would be your expectation.

**Were there any errors reported?**

You can find the errors on the console, which you can open by clicking on "Help -> Toggle Developer Tools" (`Cmd+Alt+I`). If you see something suspicious there, mentioning it on the issue will help. You can also attach the whole console log.

**If there debug diagnostics available?**

Diagnostic messages can be enabled by:

```json
"oscript.logging.level": "debug"
````

Then you open the development tools from the menu "Help" -\> "Toggle Developer Tools", perform tyhe operation that you want to investigate ans  and save the content of the console. The interesting messages will start with "[oscript]".

**What is the input OScript source that you used?**

A minimum source code reproducing the problem will be a great help. You can attach it as a file if it is too big.
