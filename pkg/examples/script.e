Integer workspace = -2000

function DAPINODE GetDocument(Integer id)
	DAPINODE node = DAPI.GetNodeByID(id, workspace, FALSE)
	if !IsError(node) and
		((node.pSubType == $Document) or (node.pSubType == $Email))
		return node
	end
end
