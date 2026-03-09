//
//  Post.swift
//  garden_app
//
//  Created by SDC-USER on 24/11/25.
//

import Foundation


struct Comment: Codable, Identifiable {
    let id: UUID
    let username: String
    let text: String
    let timeAgo: String
}


struct Post: Codable {
    let id: String
    let userId: String
    let postImageString: String
    var likesCount: Int
    let caption: String
    let timestamp: String
    var isSaved: Bool = false

    
    var author: User?
    var isLiked: Bool = false
    
    // Computed/Decorated property for display
    var displayTimestamp: String?

    
    // List of comments for this post
    var comments: [Comment] = []
    
    enum CodingKeys: String, CodingKey {
        case id, userId, postImageString, likesCount, caption, timestamp, isSaved, isLiked, comments
    }
}
