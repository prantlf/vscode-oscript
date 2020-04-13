// Gets a Livelink document.
function DAPINODE GetDocument(Integer id)
  DAPINODE node = DAPI.GetNodeByID(id, -2000, false)
  if !IsError(node) and node.pSubType == $Document
#ifdef DEBUG
    Echo(Str.Format("Document %1: %2", \
                             node.pID, node.pName))
#endif
    return node
  end
end
