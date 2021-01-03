package LIBRARY

/* Handles documents.
 */
public object Document inherits CORE::Node

	override Boolean fEnabled = TRUE

	// Gets a livelink document.
	public function DAPINODE GetDocument(Integer id)
		DAPINODE node = DAPI.GetNodeByID(id, -2000, FALSE)
		if !IsError(node) and node.pSubType == $Document
#ifdef DEBUG
			Echo(Str.Format("Document %1: %2", \
							node.pID, node.pName))
#endif
			return node
		end
	end

	script Empty
	endscript

end
