import pytest
import permissions

from permissions import Permission


pubs = {
    "scpub1": {
        "publication_number": "scpub1",
        "source_url": "https://github.com/suttacentral/bilara-data/tree/master/translation/en/sujato/sutta/kn/thag",
        "author_uid": "sujato-walton",
        "collaborator": [
            {
                "collaborator_uid": "sujato",
                "author_name": "Bhikkhu Sujato",
                "author_github_handle": "sujato",
            },
            {
                "collaborator_uid": "walton",
                "author_name": "Jessica Walton",
                "author_github_handle": "",
            },
        ],
        "text_uid": "thag",
        "text_title": "Verses of the Senior Monks",
        "text_subtitle": "A translation of the Theragāthā",
        "text_description": "This translation aims to make a clear, readable, and accurate rendering of the Theragāthā. The initial edition was by Jessica Walton and Bhikkhu Sujato was published in 2014 through SuttaCentral. A revised edition, bringing the terminology in line with the subsequently-translated four Nikāyas, was pblished in 2019.",
        "is_published": "true",
        "publication_status": "Completed, revision is ongoing.",
        "license": {
            "type": "Creative Commons Zero",
            "abbreviation": "CC0",
            "url": "https://creativecommons.org/publicdomain/zero/1.0/",
            "statement": "This translation is an expression of an ancient spiritual text that has been passed down by the Buddhist tradition for the benefit of all sentient beings. It is dedicated to the public domain via Creative Commons Zero (CC0). You are encouraged to copy, reproduce, adapt, alter, or otherwise make use of this translation. The translator respectfully requests that any use be in accordance with the values and principles of the Buddhist community.",
        },
        "licence_deprecated": "<p>This translation is an expression of an ancient spiritual text that has been passed down by the Buddhist tradition for the benefit of all sentient beings. It is dedicated to the public domain via Creative Commons Zero (CC0). You are encouraged to copy, reproduce, adapt, alter, or otherwise make use of this translation. The translator respectfully requests that any use be in accordance with the values and principles of the Buddhist community.</p><a rel='license' href='https://creativecommons.org/publicdomain/zero/1.0/'><p xmlns:dct='https://purl.org/dc/terms/' xmlns:vcard='https://www.w3.org/2001/vcard-rdf/3.0#'><span><strong>CC0 1.0 Universal (CC0 1.0) Public Domain Dedication. </strong><br>To the extent possible under law, <span property='dct:title'>Bhikkhu Sujato</span> has waived all copyright and related or neighboring rights to <span property='dct:title'>Numbered Discourses</span>. This work is published from: <span property='vcard:Country' datatype='dct:ISO3166' content='AU' about='https://suttacentral.net/an'> Australia</span>.</span></p>",
        "edition": [
            {
                "edition_number": "2",
                "publication_date": "2014",
                "publisher": "SuttaCentral",
                "publication_type": "website",
                "url": "https://suttacentral.net/thag",
            },
            {
                "edition_number": "1",
                "publication_date": "2014",
                "publisher": "SuttaCentral",
                "publication_type": "book",
                "number_of_volumes": "1",
                "url": [
                    "http://www.lulu.com/shop/bhikkhu-sujato/verses-of-the-senior-monks/hardcover/product-22152079.html",
                    "http://www.lulu.com/shop/bhikkhu-sujato/verses-of-the-senior-monks/paperback/product-22136852.html",
                ],
            },
        ],
    },
    "scpub2": {
        "publication_number": "scpub2",
        "source_url": "https://github.com/suttacentral/bilara-data/tree/master/translation/en/sujato/sutta/dn",
        "author_uid": "sujato",
        "author_name": "Bhikkhu Sujato",
        "author_github_handle": "sujato",
        "text_uid": "dn",
        "text_title": "Long Discourses",
        "text_subtitle": "A translation of the Dīgha Nikāya",
        "text_description": "<p>This translation was part of a project to translate the four Pali Nikāyas with the following aims:</p><ul><li>plain, approachable English; <li>consistent terminology; <li>accurate rendition of the Pali; <li>free of copyright.</ul><p>It was made during 2016–2018 while Bhikkhu Sujato was staying in Qimei, Tawian.</p>",
        "is_published": "true",
        "publication_status": "Completed, revision is ongoing.",
        "license": {
            "type": "Creative Commons Zero",
            "abbreviation": "CC0",
            "url": "https://creativecommons.org/publicdomain/zero/1.0/",
            "statement": "This translation is an expression of an ancient spiritual text that has been passed down by the Buddhist tradition for the benefit of all sentient beings. It is dedicated to the public domain via Creative Commons Zero (CC0). You are encouraged to copy, reproduce, adapt, alter, or otherwise make use of this translation. The translator respectfully requests that any use be in accordance with the values and principles of the Buddhist community.",
        },
        "licence_deprecated": "<p>This translation is an expression of an ancient spiritual text that has been passed down by the Buddhist tradition for the benefit of all sentient beings. It is dedicated to the public domain via Creative Commons Zero (CC0). You are encouraged to copy, reproduce, adapt, alter, or otherwise make use of this translation. The translator respectfully requests that any use be in accordance with the values and principles of the Buddhist community.</p><a rel='license' href='https://creativecommons.org/publicdomain/zero/1.0/'><p xmlns:dct='https://purl.org/dc/terms/' xmlns:vcard='https://www.w3.org/2001/vcard-rdf/3.0#'><span><strong>CC0 1.0 Universal (CC0 1.0) Public Domain Dedication. </strong><br>To the extent possible under law, <span property='dct:title'>Bhikkhu Sujato</span> has waived all copyright and related or neighboring rights to <span property='dct:title'>Numbered Discourses</span>. This work is published from: <span property='vcard:Country' datatype='dct:ISO3166' content='AU' about='https://suttacentral.net/an'> Australia</span>.</span></p>",
        "edition": [
            {
                "edition_number": "1",
                "publication_date": "2018",
                "publisher": "SuttaCentral",
                "publication_type": "website",
                "url": "https://suttacentral.net/dn",
            }
        ],
    },
    "scpub8": {
    "publication_number": "scpub8",
    "source_url": "https://github.com/suttacentral/bilara-data/tree/master/translation/en/brahmali/vinaya",
    "author_uid": "brahmali",
    "author_name": "Bhikkhu Brahmali",
    "author_github_handle": "brahmali",
    "pitaka": "vinaya",
    "text_uid": "pli-tv-vi",
    "text_title": "Theravāda Collection on Monastic Law",
    "is_published": "false",
    "publication_status": "Partial draft translation is published on SuttaCentral. Complete and extensively revised translation is underway.",
    "license": {
        "type": "(Proposed) Creative Commons Zero",
        "abbreviation": "(Proposed) CC0",
        "url": "(Proposed) https://creativecommons.org/publicdomain/zero/1.0/",
        "statement": "(Proposed) This translation is an expression of an ancient spiritual text that has been passed down by the Buddhist tradition for the benefit of all sentient beings. It is dedicated to the public domain via Creative Commons Zero (CC0). You are encouraged to copy, reproduce, adapt, alter, or otherwise make use of this translation. The translator respectfully requests that any use be in accordance with the values and principles of the Buddhist community."
    },
    "edition": [
      {
        "edition_number": "",
        "publication_date": "",
        "publisher": "",
        "publication_type": "",
        "url": ""
      }
    ]
  },
}


def test_source_url_to_path():
    url = "https://github.com/suttacentral/bilara-data/tree/master/translation/en/sujato/sutta/dn"
    assert permissions.source_url_to_path(url) == "translation/en/sujato/sutta/dn"

def test_build_rules():
    expected = {
        "sujato": {
            Permission.EDIT: [
                "sujato",
                "translation/en/sujato/sutta/kn/thag",
                "translation/en/sujato/sutta/dn",
            ],
             Permission.SUGGEST: [
                "*"
            ],
            Permission.VIEW: ["*"]
        },
        "brahmali": {
            Permission.EDIT: [
                "brahmali",
                "translation/en/brahmali/vinaya"
            ],
             Permission.SUGGEST: [
                "*"
            ],
            Permission.VIEW: ["*"]
        }
    }

    result = permissions.build_rules(pubs)

    assert expected == result

def test_get_permissions():
    filepath = 'translation/en/sujato/sutta/dn/dn1.json'

    assert permissions.get_permissions(filepath, 'sujato') == Permission.EDIT
    assert permissions.get_permissions(filepath, 'brahmali') == Permission.SUGGEST
    assert permissions.get_permissions(filepath, 'bob') == Permission.VIEW