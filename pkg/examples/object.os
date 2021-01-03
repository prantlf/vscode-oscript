package LIBRARY

public object Document inherits CORE::Node

	private Integer workspace = -2000

	public function DAPINODE GetDocument(Integer id)
		DAPINODE node = DAPI.GetNodeByID(id, workspace, FALSE)
		if !IsError(node) and node.pSubType == $Document
			return node
		end
	end

	script Clear
		List	cached = GetCache()
		Object	item

		for item in cached
		end

		function List GetCache()
			List cached = { 1, 2, 3 }
			return cached
		end
	endscript

end
