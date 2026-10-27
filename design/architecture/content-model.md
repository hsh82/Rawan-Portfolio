# Content model

`content/` is the source boundary for public owner data. JSON records use stable IDs. Journey references project and article IDs. Resume selection references existing IDs. Empty arrays are supported. The single-page homepage composes the journey, project, skills, résumé, and contact models into anchored sections.

Blog articles remain MDX. Project articles are nested under `content/blog/{locale}/projects/{project-id}/`; their `category` is `projects` and `subcategory` is the stable project ID. This lets projects own multiple articles without duplicating project details in MDX. General technical articles may keep their existing topic hierarchy.
