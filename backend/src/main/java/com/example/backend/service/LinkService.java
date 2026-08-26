package com.example.backend.service;

import com.example.backend.Enum.IMAGE_VIDEO;
import com.example.backend.Enum.Type;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface LinkService {

     void addLink(Type type, String targetId, IMAGE_VIDEO imageVideo, MultipartFile file,boolean main);

     void deleteLink(Type type, String targetId, IMAGE_VIDEO imageVideo,String url);

     List<String> getLinks(Type type, String targetId, IMAGE_VIDEO imageVideo);
}