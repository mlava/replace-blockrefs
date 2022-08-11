export default {
    onload: ({ extensionAPI }) => {
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Replace Block Reference & Bring Nested Items",
            callback: () => replaceBlockref()
        });

        async function replaceBlockref() {
            const parentBlockUID = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
            var results = await window.roamAlphaAPI.data.pull("[:block/string]", [":block/uid", parentBlockUID]);
            var refString = results[":block/string"];
            var refBlock = refString.split("((");
            refBlock = refBlock[1].split("))");
            var refblockUID = refBlock[0];

            let q = `[:find (pull ?page
                [:block/string :block/uid :block/order {:block/children ...}
                ])
             :where [?page :block/uid "${refblockUID}"]  ]`;
            var refInfo = await window.roamAlphaAPI.q(q);
            var refString = refInfo[0][0].string;

            await window.roamAlphaAPI.updateBlock({
                block: {
                    uid: parentBlockUID,
                    string: refString
                }
            });
            
            if (refInfo[0][0].hasOwnProperty('children')) {
                for (var i = 0; i < refInfo[0][0].children.length; i++) {
                    await window.roamAlphaAPI.moveBlock(
						{	location: {	"parent-uid": parentBlockUID, order: refInfo[0][0].children[i].order }, 
							block: 		{ uid: refInfo[0][0].children[i].uid}
						});
                }
            }

            var newBlockRefString = "((" + parentBlockUID + "))"
            await window.roamAlphaAPI.updateBlock({
                block: {
                    uid: refblockUID,
                    string: newBlockRefString
                }
            });
        };
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Replace Block Reference & Bring Nested Items'
        });
    }
}